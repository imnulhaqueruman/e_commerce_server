# CI/CD — Forward Development

The pipeline in `.github/workflows/ci.yml` follows a **Forward Development**
model: every push moves the artifact one stage forward, and promotion to the
next environment happens only when every gate is green. No manual approval
step, no manual test run — pushing to a branch is the entire deploy.

## TL;DR

| Branch / Tag | What runs | Where it ends up |
|---|---|---|
| any PR / `feature/*` | lint + Jest + Vitest + Docker build (no push) | — |
| `develop` | all of the above + shopflow microservices smoke | staging (`deploy/staging.yml`) |
| `main` (tag `v*.*.*`) | all of the above | prod (`deploy/prod.yml`) |

Images are pushed to GitHub Container Registry as
`ghcr.io/<owner>/e_commerce_server-api` and `…-client` (see [Image tagging](#image-tagging)).

## Triggers

```yaml
on:
  pull_request:  branches: [main, develop]
  push:
    branches: [develop, main]
    tags: ["v*.*.*"]
```

- **Pull requests** — run every gate except publishing and deploying.
- **Push to `develop`** — full pipeline including shopflow smoke, then deploy staging.
- **Push to `main`** — same pipeline, no deploy (waits for a tag).
- **Tag `vX.Y.Z` on `main`** — full pipeline, then deploy prod.

## Job chain

```
       lint
         │
         ▼
   test-server ─┐
   test-client ─┼─▶ docker ─▶ deploy (staging | prod)
  test-shopflow ─┘
```

Each job has a single responsibility. The `docker` job is gated on **all four**
tests succeeding, so a green image always means a green repo.

### 1. `lint`

Runs on every PR and push.

- `npm ci` at the repo root.
- `npm ci` in `client/`.
- `npm run lint` in `client/` (ESLint, `--max-warnings 0`).

### 2. `test-server` — Jest

- `npm ci` at the root.
- `npm test` (`jest --runInBand`).
- `mongodb-memory-server` is already in `devDependencies`, so no external
  Mongo is required. The job forces `USE_MEMORY_MONGO=1` and fakes
  `JWT_SECRET`, `Stripe_Secret`, and `CLOUDINARY_*` for the run.

### 3. `test-client` — Vitest

- `npm ci` in `client/` (uses `client/package-lock.json` for cache).
- `npm test` (Vitest run).

### 4. `test-shopflow` — microservices smoke

Push-only (skipped on PRs to keep them fast).

- `cd shopflow && docker compose up -d --build` — boots user / product /
  inventory services behind the Nginx gateway on `:8080`.
- Waits up to 60s for the gateway.
- `curl http://localhost:8080/api/products` — confirms the product-service
  routes through the gateway.
- `docker compose down -v` (always) — always tears down to free GH Actions
  disk.

### 5. `docker` — build & publish

- Computes `sha` (short SHA), `branch` (slug), and `version` (tag name).
- Logs in to GHCR (`packages: write` permission).
- Builds and pushes two images, each tagged with `sha` and `branch`, plus
  the tag name on releases:
  - `Dockerfile` (root) → `*-api`
  - `client/Dockerfile` → `*-client`
- PRs build without pushing so the pipeline can be exercised without
  publishing packages.

### 6. `deploy` — SSH roll-out

Matrix over `staging` and `prod`. Each entry chooses its host secrets, the
compose file, and the branch/tag that triggers it.

- `appleboy/ssh-action` connects using the matching secrets.
- Exports `API_IMAGE` and `CLIENT_IMAGE` to the SHA (staging) or tag
  (prod) computed in step 5.
- `docker compose -f <file> pull && up -d --remove-orphans`.
- `docker image prune -f` to reclaim disk.

The deploy script is intentionally idempotent — re-running it on the same
SHA is a no-op.

## Image tagging

| Trigger | `*-api` tag | `*-client` tag |
|---|---|---|
| PR `#42` | (built locally, not pushed) | (built locally, not pushed) |
| push to `develop`, SHA `abc123…` | `sha-abc123…`, `branch-develop` | `sha-abc123…`, `branch-develop` |
| tag `v1.2.3` on `main` | `v1.2.3`, `sha-abc123…`, `branch-main` | `sha-abc123…`, `branch-main` |

The deploy job uses the `sha-*` tag in staging and the version tag in prod.

## Required secrets

Configure under **Settings → Secrets and variables → Actions**.

### Runtime (used by the app at deploy time)

| Secret | Used for |
|---|---|
| `JWT_SECRET` | signing auth tokens |
| `Stripe_Secret` | payment-intent creation |
| `CLOUDINARY_CLOUD_NAME` | image uploads |
| `CLOUDINARY_API_KEY` | image uploads |
| `CLOUDINARY_API_SECRET` | image uploads |

### Deploy (only used by the `deploy` job)

| Secret | Used for |
|---|---|
| `DEPLOY_HOST_STAGING` | staging SSH host |
| `DEPLOY_SSH_KEY_STAGING` | staging SSH private key |
| `DEPLOY_KNOWN_HOSTS_STAGING` | staging `known_hosts` line |
| `DEPLOY_HOST` | prod SSH host |
| `DEPLOY_SSH_KEY` | prod SSH private key |
| `DEPLOY_KNOWN_HOSTS` | prod `known_hosts` line |
| `DEPLOY_USER` (optional) | SSH username (defaults to `deploy`) |

### Automatic

- `GITHUB_TOKEN` — used to log in to GHCR. No setup needed.

### CI-only fakes (no secret needed)

The `test-server` job substitutes placeholder values for `JWT_SECRET`,
`Stripe_Secret`, and the `CLOUDINARY_*` triple via job-level `env:`. These
never reach the deployed app.

## Required deploy-host layout

The host pointed to by `DEPLOY_HOST[_STAGING]` must have:

1. The deploy user able to SSH in with the key from `DEPLOY_SSH_KEY[_STAGING]`.
2. `/srv/e_commerce_server` cloned from this repo.
3. `/srv/e_commerce_server/.env` populated with the runtime secrets
   (see `.env.example`). The deploy job does not write this file.
4. `docker` and `docker compose` available, with the deploy user in the
   `docker` group (or running as root).

A minimal `/srv/e_commerce_server/.env` for the deploy host:

```bash
DB_NAME=ecommerce
JWT_SECRET=<from repo secret>
Stripe_Secret=<from repo secret>
CLOUDINARY_CLOUD_NAME=<from repo secret>
CLOUDINARY_API_KEY=<from repo secret>
CLOUDINARY_API_SECRET=<from repo secret>
```

## Local development

The pipeline runs the same commands you can run locally:

```bash
# Server
npm ci
npm test                       # uses mongodb-memory-server

# Client
cd client && npm ci && npm test && npm run lint

# Shopflow smoke
cd shopflow && docker compose up -d --build
curl http://localhost:8080/api/products
docker compose down -v
```

If a CI gate fails locally, the same fix unblocks the pipeline.

## Day-to-day workflow

1. **Cut a feature branch** from `develop`.
2. Push commits — PR runs lint, tests, and a non-publishing Docker build.
3. Merge to `develop` — green pipeline publishes images and rolls staging.
4. Tag `main` with `vX.Y.Z` once staging looks good — pipeline rolls prod.

## Rolling back

### Staging

Re-run the workflow on the previous `develop` SHA, or push a revert and
let the pipeline redeploy. The deploy job pulls the chosen image — rolling
forward is the same operation as rolling back.

### Prod

```bash
# On the prod host, override the image tag and reload:
cd /srv/e_commerce_server
export API_IMAGE=ghcr.io/<owner>/e_commerce_server-api:v<previous>
export CLIENT_IMAGE=ghcr.io/<owner>/e_commerce_server-client:sha-<previous>
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d --remove-orphans
```

(Every release tag is preserved in GHCR, so re-tagging is not necessary.)

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `test-server` fails with `Cannot find module 'mongodb-memory-server'` | devDependency missing locally | `npm ci` |
| `test-shopflow` times out | Docker daemon not ready | Re-run the workflow; check runner capacity |
| `deploy` fails with `Permission denied (publickey)` | Wrong deploy SSH key | Re-paste `DEPLOY_SSH_KEY[_STAGING]` into repo secrets |
| `deploy` fails with `Host key verification failed` | Missing/wrong `DEPLOY_KNOWN_HOSTS[_STAGING]` | `ssh-keyscan <host>` → paste into the secret |
| Image pushed but API container uses old image | Stale deploy host | `docker compose -f docker-compose.prod.yml pull && up -d` on the host |
| Prod deploy didn't trigger | Push was to `main` without a `v*` tag | Tag `main` at the desired commit and push the tag |

## Files in this pipeline

```
.github/workflows/ci.yml     # the pipeline
Dockerfile                    # root API image
client/Dockerfile             # client image (Vite → nginx)
deploy/nginx.conf             # SPA fallback + /api proxy
deploy/staging.yml            # staging compose
deploy/prod.yml               # prod compose
docker-compose.staging.yml    # symlink → deploy/staging.yml
docker-compose.prod.yml       # symlink → deploy/prod.yml
.env.example                  # every env var the app + deploy needs
```
