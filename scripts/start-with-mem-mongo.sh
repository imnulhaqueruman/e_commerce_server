#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

URI="$(cat /tmp/mem-mongo.uri)"
export MONGO_URI="$URI"
export DB_NAME="${DB_NAME:-ecommerce}"

echo "Using MONGO_URI=$MONGO_URI  DB_NAME=$DB_NAME"

exec npm run dev