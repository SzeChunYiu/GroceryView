#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-${ROOT_DIR}/infra/db/migrations}"
POSTGIS_IMAGE="${POSTGIS_IMAGE:-postgis/postgis:18-3.6}"
POSTGRES_DB="${POSTGRES_DB:-groceryview}"
POSTGRES_USER="${POSTGRES_USER:-groceryview}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-groceryview}"
CONTAINER_NAME="groceryview-migration-verify-$RANDOM-$$"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to verify database migrations" >&2
  exit 127
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "migration directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

mapfile -t MIGRATIONS < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' | sort)
if [ "${#MIGRATIONS[@]}" -eq 0 ]; then
  echo "no SQL migrations found in $MIGRATIONS_DIR" >&2
  exit 1
fi

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d \
  --name "$CONTAINER_NAME" \
  -e "POSTGRES_DB=$POSTGRES_DB" \
  -e "POSTGRES_USER=$POSTGRES_USER" \
  -e "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" \
  "$POSTGIS_IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null

for migration in "${MIGRATIONS[@]}"; do
  echo "applying $(basename "$migration")"
  docker exec -i "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
    < "$migration"
done

echo "applied ${#MIGRATIONS[@]} migration(s) successfully"
