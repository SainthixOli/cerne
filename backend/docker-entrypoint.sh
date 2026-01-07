#!/bin/sh

# Wait for DB (simple wait, in prod use wait-for-it)
echo "Waiting for Database..."
sleep 5

# Run migrations
echo "Running Migrations..."
npx prisma migrate deploy

# Start App
echo "Starting Application..."
node dist/main
