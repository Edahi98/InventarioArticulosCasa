#!/bin/sh
set -e

if [ "$ENGINE" = "local" ]; then
  echo "Applying DB schema (Postgres/Supabase)..."
  npx drizzle-kit push --config=drizzle.config.pg.ts
else
  echo "Applying DB schema (Turso/libSQL)..."
  npx drizzle-kit push --config=drizzle.config.ts
fi

echo "Starting server..."
exec node dist/src/server.js
