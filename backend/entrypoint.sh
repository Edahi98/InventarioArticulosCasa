#!/bin/sh
set -e

echo "Applying DB schema (Postgres/Supabase)..."
npx drizzle-kit push --config=drizzle.config.ts

echo "Starting server..."
exec node dist/src/server.js
