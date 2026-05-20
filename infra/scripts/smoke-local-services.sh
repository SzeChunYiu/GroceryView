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

print_service_diagnostics() {
  local service
  for service in "$POSTGRES_SERVICE" "$REDIS_SERVICE" "$OBJECT_STORAGE_SERVICE" "$OBJECT_STORAGE_INIT_SERVICE"; do
    echo "::group::local service diagnostics: $service" >&2
    local id
    id="$(container_id "$service" || true)"
    if [ -n "$id" ]; then
      docker inspect \
        -f 'name={{.Name}} status={{.State.Status}} health={{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}} exit={{.State.ExitCode}} error={{.State.Error}}' \
        "$id" >&2 || true
    else
      echo "container not found for service: $service" >&2
    fi
    compose ps "$service" >&2 || true
    compose logs --no-color --tail=120 "$service" >&2 || true
    echo "::endgroup::" >&2
  done
}

fail_with_diagnostics() {
  echo "$1" >&2
  print_service_diagnostics
  exit 1
}

wait_healthy() {
  local service="$1"
  local id
  id="$(container_id "$service")"
  if [ -z "$id" ]; then
    fail_with_diagnostics "service did not start: $service"
  fi

  for _ in $(seq 1 "$WAIT_SECONDS"); do
    if [ "$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$id")" = "healthy" ]; then
      return 0
    fi
    sleep 1
  done

  fail_with_diagnostics "service did not become healthy within ${WAIT_SECONDS}s: $service"
}

compose up -d "$POSTGRES_SERVICE" "$REDIS_SERVICE" "$OBJECT_STORAGE_SERVICE" "$OBJECT_STORAGE_INIT_SERVICE"

wait_healthy "$POSTGRES_SERVICE"
wait_healthy "$REDIS_SERVICE"
wait_healthy "$OBJECT_STORAGE_SERVICE"

compose exec -T "$POSTGRES_SERVICE" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null || fail_with_diagnostics "postgres readiness probe failed"
compose exec -T "$REDIS_SERVICE" redis-cli ping | grep -qx "PONG" || fail_with_diagnostics "redis ping failed"
compose run --rm "$OBJECT_STORAGE_INIT_SERVICE" >/dev/null || fail_with_diagnostics "object storage bucket initialization failed"
compose run --rm --entrypoint /bin/sh "$OBJECT_STORAGE_INIT_SERVICE" -c '
  mc alias set local http://object-storage:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null
  mc ls "local/$S3_BUCKET" >/dev/null
' || fail_with_diagnostics "object storage bucket verification failed"

echo "Local services ready: postgres redis object-storage bucket=$S3_BUCKET"
