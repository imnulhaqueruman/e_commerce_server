# e_commerce_server

![CI/CD](https://github.com/imnulhaqueruman/e_commerce_server/actions/workflows/ci.yml/badge.svg)

Node.js + Express + MongoDB API for the e-commerce app.

For the CI/CD pipeline (Forward Development flow, image tagging, secrets,
rollback procedure) see **[CI_CD.md](./CI_CD.md)**.

## Prerequisites

- Node.js 18+
- Docker + Docker Compose

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Start MongoDB in Docker (data persisted in the `mongo-data` volume)
docker compose up -d

# 3. Copy env vars and fill in real values for Cloudinary / Stripe / Firebase
#    (edit .env directly if it already exists)

# 4. Run the API in dev mode
npm run dev
```

The server listens on `http://localhost:5000` and only starts accepting
requests after MongoDB is reachable, so routes that touch the database
won't 404 on a buffering timeout.

## Stopping MongoDB

```bash
docker compose down           # keep data
docker compose down -v        # also wipe the `mongo-data` volume
```

## CI/CD (Forward Development)

Every push moves the artifact forward through tested gates — no manual step
required to ship. The pipeline lives in `.github/workflows/ci.yml`.

| Branch / Tag | Gates run | Deploys to |
|---|---|---|
| PR / `feature/*` | lint + Jest (root) + Vitest (client) + Docker build | — |
| `develop` | all of the above + shopflow microservices smoke | staging (via `deploy/staging.yml`) |
| `main` (tag `v*`) | all of the above | prod (via `deploy/prod.yml`) |

Required repo secrets: `JWT_SECRET`, `Stripe_Secret`, `CLOUDINARY_*`, and
for deploy: `DEPLOY_HOST[_STAGING]`, `DEPLOY_SSH_KEY[_STAGING]`,
`DEPLOY_KNOWN_HOSTS[_STAGING]`. PRs build images but never push; pushes
publish to GHCR as `ghcr.io/<owner>/e_commerce_server-api` and
`…-client` tagged with the short SHA and branch name.
