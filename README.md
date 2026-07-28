# e_commerce_server

Node.js + Express + MongoDB API for the e-commerce app.

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
