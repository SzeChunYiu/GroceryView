#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/infra/docker-compose.yml}"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
REDIS_SERVICE="${REDIS_SERVICE:-redis}"
OBJECT_STORAGE_SERVICE="${OBJECT_STORAGE_SERVICE:-object-storage}"
OBJECT_STORAGE_INIT_SERVICE="${OBJECT_STORAGE_INIT_SERVICE:-object-storage-init}"
POSTGRES_DB="${POSTGRES_DB:-groceryview}"
POSTGRES_USER="${POSTGRES_USER:-groceryview}"
S3_BUCKET="${S3_BUCKET:-groceryview-raw}"
WAIT_SECONDS="${WAIT_SECONDS:-90}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to smoke-test local services" >&2
  exit 127
fi

compose() {
  docker compose -f "$COMPOSE_FILE" "$@"
}

container_id() {
  compose ps -q "$1"
}

wait_healthy() {
  local service="$1"
  local id
  id="$(container_id "$service")"
  if [ -z "$id" ]; then
    echo "service did not start: $service" >&2
    exit 1
  fi

  for _ in $(seq 1 "$WAIT_SECONDS"); do
    if [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")" = "healthy" ]; then
      return 0
    fi
    sleep 1
  done

  echo "service did not become healthy within ${WAIT_SECONDS}s: $service" >&2
  compose ps "$service" >&2 || true
  exit 1
}

compose up -d "$POSTGRES_SERVICE" "$REDIS_SERVICE" "$OBJECT_STORAGE_SERVICE" "$OBJECT_STORAGE_INIT_SERVICE"

wait_healthy "$POSTGRES_SERVICE"
wait_healthy "$REDIS_SERVICE"
wait_healthy "$OBJECT_STORAGE_SERVICE"

compose exec -T "$POSTGRES_SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null
compose exec -T "$REDIS_SERVICE" redis-cli ping | grep -qx "PONG"
compose run --rm "$OBJECT_STORAGE_INIT_SERVICE" >/dev/null
compose run --rm --entrypoint /bin/sh "$OBJECT_STORAGE_INIT_SERVICE" -c '
  mc alias set local http://object-storage:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
  mc ls "local/$S3_BUCKET" >/dev/null
'

echo "Local services ready: postgres redis object-storage bucket=$S3_BUCKET"
