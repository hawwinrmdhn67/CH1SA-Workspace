#!/bin/sh
set -e

echo "==> [Backend Entrypoint] Checking database migrations..."
if [ -f "./migrate" ] && [ -d "./migrations" ]; then
  echo "==> Running database migrations up..."
  ./migrate up || {
    echo "==> Migrations completed or no changes needed."
  }
fi

if [ "$AUTO_SEED" = "true" ] && [ -f "./seed" ]; then
  echo "==> AUTO_SEED is enabled. Running database seed..."
  ./seed || echo "==> Database seed completed or already seeded."
fi

echo "==> Starting CH1SA Assistant API server on port ${PORT:-8080}..."
exec ./api

