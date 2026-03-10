#!/bin/sh
set -e

echo "Waiting for database to be ready..."
until node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => { pool.end(); process.exit(0); }).catch(() => { pool.end(); process.exit(1); });
" 2>/dev/null; do
  echo "Database not ready, retrying in 2s..."
  sleep 2
done

echo "Database is ready. Running migrations..."
node script/migrate.cjs
if [ $? -ne 0 ]; then
  echo "ERROR: Migration failed. Exiting."
  exit 1
fi

echo "Starting application..."
exec node dist/index.cjs
