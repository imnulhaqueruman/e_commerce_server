# ShopFlow — Microservices Reference

A small, fully Dockerized Node.js microservices stack with a React frontend and Nginx API gateway.

```
shopflow/
├── user-service/        # port 4001 — auth (register/login/me)
├── product-service/     # port 4002 — product CRUD
├── inventory-service/   # port 4003 — stock by product_id
├── frontend/            # React + Vite, served by Nginx on 3000
├── nginx/               # Gateway on 8080, routes /api/* to services
├── docker-compose.yml
└── .env
```

## Quick start

```bash
# 1. From this folder, copy/edit env vars if needed
cat .env

# 2. Build & run the whole stack
docker compose up -d --build

# 3. Open the app
open http://localhost:8080          # frontend (register/login/products)
curl http://localhost:8080/health   # gateway health
```

MongoDB data is persisted in the `shopflow-mongo-data` named volume.

```bash
# Tear down (keep data)
docker compose down

# Tear down and wipe data
docker compose down -v
```

## Services

| Service          | Internal port | URL (inside Docker network) | Public port |
|------------------|---------------|------------------------------|-------------|
| mongo            | 27017         | `mongo:27017`                | 27017       |
| user-service     | 4001          | `user-service:4001`          | —           |
| product-service  | 4002          | `product-service:4002`       | —           |
| inventory-service| 4003          | `inventory-service:4003`     | —           |
| frontend         | 3000          | `frontend:3000`              | —           |
| nginx (gateway)  | 80            | `nginx:80`                   | **8080**    |

All services share the `shopflow_net` bridge network so they can resolve each other by container name.

## API

All endpoints are reached through the gateway at `http://localhost:8080`.

### Health

```http
GET /health                          → 200 {"status":"ok"}
GET /api/users/health                → 200 {"status":"ok"}
GET /api/products/health             → 200 {"status":"ok"}
GET /api/inventory/health            → 200 {"status":"ok"}
```

### user-service

| Method | Path                | Auth | Body                                  | Returns                          |
|--------|---------------------|------|---------------------------------------|----------------------------------|
| POST   | `/api/users/register` | no   | `{ name, email, password }`           | `{ token, user }`                |
| POST   | `/api/users/login`    | no   | `{ email, password }`                 | `{ token, user }`                |
| GET    | `/api/users/me`       | yes  | —                                     | safe user object                 |

### product-service

| Method | Path                  | Auth | Body                                  | Returns       |
|--------|-----------------------|------|---------------------------------------|---------------|
| GET    | `/api/products/`      | no   | —                                     | `Product[]`   |
| GET    | `/api/products/:id`   | no   | —                                     | `Product`     |
| POST   | `/api/products/`      | yes  | `{ name, description?, price, category }` | created `Product` |
| PUT    | `/api/products/:id`   | yes  | partial `Product` fields              | updated `Product` |
| DELETE | `/api/products/:id`   | yes  | —                                     | `{ ok: true }` |

### inventory-service

| Method | Path                          | Auth | Body                          | Returns                              |
|--------|-------------------------------|------|-------------------------------|--------------------------------------|
| GET    | `/api/inventory/`             | no   | —                             | `Stock[]`                            |
| GET    | `/api/inventory/:product_id`  | no   | —                             | `Stock` (defaults to qty 0 if none)  |
| POST   | `/api/inventory/`             | yes  | `{ product_id, quantity }`    | upserted `Stock`                     |
| PUT    | `/api/inventory/:product_id`  | yes  | `{ quantity }`                 | upserted `Stock`                     |

## Auth flow

1. `POST /api/users/register` → JWT (HS256, signed with `JWT_SECRET`).
2. Store the token in the frontend (`localStorage`); the axios client sends it as `Authorization: Bearer <token>` automatically.
3. The same `JWT_SECRET` is shared across services so any service with the auth middleware accepts tokens issued by user-service.

## End-to-end demo

```bash
# 1. Register
TOKEN=$(curl -s -X POST http://localhost:8080/api/users/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ada","email":"ada@example.com","password":"secret123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["token"])')

# 2. Create a product
PRODUCT=$(curl -s -X POST http://localhost:8080/api/products/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Coffee","price":3.5,"category":"drinks"}')
PID=$(echo "$PRODUCT" | python3 -c 'import sys,json; print(json.load(sys.stdin)["_id"])')

# 3. Set stock
curl -s -X POST http://localhost:8080/api/inventory/ \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"product_id\":\"$PID\",\"quantity\":42}"

# 4. Browse
open http://localhost:8080/products
```

## Notes

- All services use `node:20-alpine` images; the frontend uses a multi-stage build (`node:20-alpine` → `nginx:alpine`).
- `JWT_SECRET` and `MONGO_URI` are loaded from `.env` at compose time.
- Each service exposes `GET /health`; docker-compose waits for `/health` to respond before bringing up dependent services.