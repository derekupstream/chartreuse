#!/bin/bash
# The safe schema-change workflow as ONE command — because the step people forget
# (restarting the dev server) is the step that causes the stale-server trap.
#
#   ./scripts/apply-migration.sh 20260901000000_change_request_references
#
# Applies the migration SQL to the local DB, regenerates the Prisma client, then stops
# any dev server on :3000 (its cached client is now stale by definition). Start it again
# with `yarn dev`. NEVER use `yarn prisma:sync` for this — it overwrites schema.prisma.
set -euo pipefail

MIGRATION="${1:?usage: ./scripts/apply-migration.sh <migration_dir_name>}"
SQL="prisma/migrations/$MIGRATION/migration.sql"
[ -f "$SQL" ] || { echo "not found: $SQL"; exit 1; }

PSQL="/Applications/Postgres.app/Contents/Versions/latest/bin/psql"
DB="${LOCAL_DB:-chartreuse_local}"

echo "→ applying $SQL to $DB"
"$PSQL" -d "$DB" -f "$SQL"

echo "→ regenerating Prisma client"
npx prisma generate >/dev/null

PID=$(lsof -ti tcp:3000 || true)
if [ -n "$PID" ]; then
  echo "→ stopping dev server (pid $PID) — its cached Prisma client is now stale"
  kill "$PID"
  rm -rf .next
  echo "✓ migration applied. Start the server again: yarn dev"
else
  echo "✓ migration applied. No dev server was running."
fi
