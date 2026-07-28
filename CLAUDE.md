# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo holds **three independent sub-projects** that share a git history but are deployed/run separately:

- **Root** (`/`) — the primary Node.js + Express + MongoDB e-commerce API. This is what `package.json`, `server.js`, `README.md`, and `docker-compose.yml` at the root refer to.
- **`client/`** — React 18 + Vite + TypeScript SPA that consumes the root API. Has its own `package.json` and `node_modules`.
- **`shopflow/`** — a **separate, self-contained** microservices reference stack (user / product / inventory services + Nginx gateway + its own React frontend), fully Dockerized. It does **not** share code or a database with the root API; treat it as its own project (see `shopflow/README.md`).

Unless a task names `client/` or `shopflow/`, assume it concerns the root API.

## Commands

### Root API (run from repo root)
```bash
npm install
docker compose up -d            # local MongoDB on :27017 (mongo:6, persisted in `mongo-data` volume)
npm run dev                     # nodemon server.js, listens on http://localhost:5000
npm start                       # node server.js (production)
docker compose down             # stop Mongo, keep data
docker compose down -v          # stop Mongo and wipe the volume
```

The server only starts listening **after** MongoDB connects, so DB-touching routes won't 404 during boot. If no local Mongo is available, boot an in-process replacement:
```bash
USE_MEMORY_MONGO=1 npm run dev                          # auto-fallback inside server.js
# or run it explicitly:
node scripts/mem-mongo.js > /tmp/mem-mongo.uri &        # prints the memory-server URI to stdout
./scripts/start-with-mem-mongo.sh                       # reads /tmp/mem-mongo.uri into MONGO_URI and runs dev
```

### Client (run from `client/`)
```bash
cd client
npm install
npm run dev                     # Vite on http://localhost:3000, proxies /api -> http://localhost:5000
npm run build                   # tsc -b && vite build
npm run lint                    # eslint, --max-warnings 0
```

### Shopflow (run from `shopflow/`)
```bash
cd shopflow && docker compose up -d --build   # gateway on http://localhost:8080
```

**There is no test suite in any of the three sub-projects** — no test runner is configured.

## Architecture — root API

### Boot & route auto-mounting
`server.js` connects to Mongo, installs `morgan`/`body-parser`/`cors`, then mounts routes with a **filesystem scan**:
```js
fs.readdirSync('./routes').map((r) => app.use('/api', require('./routes/' + r)));
```
Every file in `routes/` is auto-mounted under `/api` in filesystem order (no central route registry). **To add an API surface, drop a file in `routes/`** — it is picked up automatically.

Mounting order matters for Express pattern matching (first registered pattern wins). Within a single file, register **literal paths before `:param` patterns** — e.g. `product.js` registers `GET /products/total` *before* `GET /products/:count`, so `/products/total` isn't swallowed by `:count`. Across files the order is whatever `readdirSync` returns, so a literal path in one file can shadow a `:param` route in another depending on filename order — keep literal-vs-param overlaps within the same file where you control the order.

### Two coexisting auth systems
The API has **both** an active JWT auth path and a legacy Firebase path. Route files typically `require` both middleware sets but only wire one per endpoint:

- **JWT (current, used by `client/`)** — `middlewares/jwt.js`:
  - `requireAuth` reads `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, sets `req.user = { email }`.
  - `requireAdmin` runs **after** `requireAuth` and checks `User.role === 'admin'`.
  - Issued by `controllers/auth.js` `register`/`login` (`signToken`, 7d expiry, payload `{ email, role }`). `logout` is stateless — the client just discards the token.
- **Firebase (legacy, kept for backwards compat)** — `middlewares/auth.js`:
  - `authCheck` verifies a Firebase ID token from the `authtoken` header via `firebase/index.js` (firebase-admin initialized from `config/fbServiceAccountKey.json`), sets `req.user` to the Firebase user.
  - `adminCheck` then looks up the User by email and checks `role === 'admin'`.
  - Legacy endpoints: `POST /create-or-update-user`, `POST /current-user`, `POST /current-admin` (see `routes/auth.js`).

**Admin authorization is role-based on the `User` model** (`role` defaults to `'subscribe'`; set `'admin'` to grant admin). Admin-protected routes chain `requireAuth, requireAdmin` (or `authCheck, adminCheck`).

### Domain models & key flows
Models (`models/`): `User`, `Product`, `Category`, `Sub`, `Coupon`, `Cart`, `Order`. Note `mongoose@5` (older API — no `mongoose.connect` options object promisification assumptions, callbacks still appear in places like `controllers/product.js`).

- **Products** are keyed by `slug` (auto-generated from `title` via `slugify` in create/update). Read/update/delete look up by `:slug`, not `_id`. `price` is stored as a **String** (not Number) — be aware of this in any arithmetic. Search/filter (`POST /search/filters`, `controllers/product.js` `searchFilters`) dispatches to per-field handler functions (`handleQuery`, `handlePrice`, `handleCategory`, `handleStars`, `handleSub`, `handleColor`, `handleBrand`, `handleShipping`) based on which body fields are present; it returns on the first matching handler rather than combining filters.
- **Cart is server-side and one-per-user**: `controllers/user.js` `userCart` deletes any existing cart for the user, re-derives line prices from the DB, and saves a new `Cart` keyed by `orderedBy`. `getUserCart` populates product info back out.
- **Checkout flow**: `POST /create-payment-intent` (`controllers/stripe.js`, env `Stripe_Secret` — note the capital-S casing) creates a Stripe PaymentIntent for the cart total (or `totalAfterDiscount` if a coupon was applied). The client then calls `POST /user/order`, which copies the cart's products into a new `Order` and runs a `Product.bulkWrite` to decrement `quantity` and increment `sold` per line item.
- **Coupons**: `applyCouponToUserCart` validates the coupon by `name`, computes `totalAfterDiscount = cartTotal * (1 - discount/100)`, and persists it on the `Cart`.
- **Images**: `controllers/cloudinary.js` uploads/removes via Cloudinary (env `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`); admin-only.

### Required environment variables (root `.env`)
`PORT`, `DB_NAME` (default `ecommerce`), `MONGO_URI` (optional, defaults to `mongodb://localhost:27017/<DB_NAME>`), `JWT_SECRET`, `Stripe_Secret` (capital S), `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`, optional `USE_MEMORY_MONGO`. The committed `.env` has placeholder values.

## Architecture — client

- React 18 + Vite + TypeScript. State/data: **Zustand** (`store/`) for auth, **TanStack Query** for server state. Forms: `react-hook-form` + `zod`. Styling: Tailwind with shadcn-style primitives in `components/ui/`. `@` is aliased to `src/`.
- API layer: a single axios instance (`lib/fetcher.ts`) with `baseURL: '/api'` and a request interceptor that attaches `Authorization: Bearer <token>` from `localStorage` key `ecom_token`. A 401 response triggers an `onUnauthorized` handler (set at app init). The Vite dev server proxies `/api` → `http://localhost:5000` (see `vite.config.ts`).
- Per-domain API hooks live in `src/api/` (e.g. `useLogin`, `useRegister`, `useCurrentUser` in `api/auth.ts`), each wrapping a TanStack Query mutation/query.
- The client uses the **JWT auth path only** (`/auth/register`, `/auth/login`, `/auth/logout`, `/auth/current-user`); it does not use the legacy Firebase endpoints.

## Architecture — shopflow (separate project)

A standalone Dockerized microservices demo, unrelated to the root API. Three Node services (`user-service` :4001, `product-service` :4002, `inventory-service` :4003) behind an Nginx gateway on **:8080**, sharing one Mongo and one `JWT_SECRET` so any service's auth middleware accepts user-service tokens. Run with `docker compose up -d --build` from `shopflow/`. Full API reference in `shopflow/README.md`.
