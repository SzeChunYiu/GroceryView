#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
MIGRATIONS_DIR="${MIGRATIONS_DIR:-${ROOT_DIR}/infra/db/migrations}"
SEEDS_DIR="${SEEDS_DIR:-${ROOT_DIR}/infra/db/seeds}"
POSTGIS_IMAGE="${POSTGIS_IMAGE:-postgis/postgis:18-3.6}"
POSTGRES_DB="${POSTGRES_DB-groceryview}"
POSTGRES_USER="${POSTGRES_USER-groceryview}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD-groceryview}"
POSTGRES_READY_TIMEOUT_SECONDS="${POSTGRES_READY_TIMEOUT_SECONDS:-60}"
CONTAINER_NAME="groceryview-migration-verify-$RANDOM-$$"

for required_name in POSTGRES_DB POSTGRES_USER POSTGRES_PASSWORD; do
  if [ -z "${!required_name}" ]; then
    echo "$required_name must not be empty" >&2
    exit 1
  fi
done

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required to verify database migrations" >&2
  exit 127
fi

case "$POSTGRES_READY_TIMEOUT_SECONDS" in
  ''|*[!0-9]*)
    echo "POSTGRES_READY_TIMEOUT_SECONDS must be a positive integer" >&2
    exit 1
    ;;
esac

if [ "$POSTGRES_READY_TIMEOUT_SECONDS" -lt 1 ]; then
  echo "POSTGRES_READY_TIMEOUT_SECONDS must be a positive integer" >&2
  exit 1
fi

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "migration directory not found: $MIGRATIONS_DIR" >&2
  exit 1
fi

MIGRATIONS=()
while IFS= read -r migration; do
  MIGRATIONS+=("$migration")
done < <(find "$MIGRATIONS_DIR" -maxdepth 1 -type f -name '*.sql' ! -name '._*.sql' | sort)
if [ "${#MIGRATIONS[@]}" -eq 0 ]; then
  echo "no SQL migrations found in $MIGRATIONS_DIR" >&2
  exit 1
fi

REQUIRED_TABLES=(
  chains
  stores
  products
  fuel_grades
  aliases
  source_runs
  raw_records
  retailer_source_policies
  fuel_price_sources
  fuel_price_source_observations
  observations
  observations_v2
  latest_prices
  price_daily
  price_weekly
  users
  watchlists
  baskets
  budgets
  alerts
  price_alerts
  app_users
  favorite_stores
  user_preferences
  watchlist_items
  weekly_baskets
  basket_items
  basket_import_review_items
  human_review_assignments
  human_reviewers
  community_reporter_trust
  subscription_entitlements
  notification_tasks
  notification_suppressions
  alert_rules
  pantry_items
  receipt_uploads
  receipt_items
  household_plans
  household_members
  household_basket_items
  household_watchlist_items
  household_favorite_stores
)

REQUIRED_EXTENSIONS=(
  pgcrypto
  postgis
  pg_trgm
)

REQUIRED_SEED_CHAIN_SLUGS=(
  ica
  willys
  coop
  hemkop
  lidl
  city-gross
)

REQUIRED_SEED_STORE_SLUGS=(
  ica-nara-baronen-odenplan
  willys-hemma-stockholm-torsplan
  coop-odenplan
  hemkop-stockholm-torsplan
  lidl-stockholm-sveavagen
  city-gross-bromma
)

REQUIRED_SEED_PRODUCT_SLUGS=(
  standardmjolk-1l
  agg-12-pack
  smor-500g
  bryggkaffe-450g
  kycklingfile-1kg
  notfars-500g
  pasta-500g
  basmatiris-1kg
  formbrod-rost-700g
  hushallsost-1kg
  bananer-1kg
  tomater-500g
  potatis-2kg
  toalettpapper-8-pack
  tvattmedel-color-1l
  blojor-storlek-4
  havredryck-1l
  naturell-yoghurt-1kg
  olivolja-500ml
  fryst-pizza-350g
)

sql_values() {
  local values=""
  local value
  for value in "$@"; do
    values="${values}('${value}'),"
  done
  printf '%s' "${values%,}"
}

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

for _ in $(seq 1 "$POSTGRES_READY_TIMEOUT_SECONDS"); do
  if docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec "$CONTAINER_NAME" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null

docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "create table if not exists schema_migrations (version text primary key, applied_at timestamptz not null default now())" >/dev/null

for migration in "${MIGRATIONS[@]}"; do
  echo "applying $(basename "$migration")"
  docker exec -i "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
    < "$migration"
  version="$(basename "$migration" .sql)"
  docker exec "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
    -c "insert into schema_migrations(version) values ('${version}') on conflict (version) do nothing" >/dev/null
done

echo "applied ${#MIGRATIONS[@]} migration(s) successfully"

required_migration_values=""
for migration in "${MIGRATIONS[@]}"; do
  required_migration_values="${required_migration_values}('$(basename "$migration" .sql)'),"
done
required_migration_values="${required_migration_values%,}"

missing_migrations="$(
  docker exec "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "with required(version) as (values ${required_migration_values})
     select coalesce(string_agg(required.version, ',' order by required.version), '')
     from required
     left join schema_migrations applied
       on applied.version = required.version
     where applied.version is null"
)"

if [ -n "$missing_migrations" ]; then
  echo "migration metadata assertion failed: missing ${missing_migrations}" >&2
  exit 1
fi

echo "migration metadata ok"

required_table_values=""
for table in "${REQUIRED_TABLES[@]}"; do
  required_table_values="${required_table_values}('${table}'),"
done
required_table_values="${required_table_values%,}"

missing_tables="$(
  docker exec "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "with required(table_name) as (values ${required_table_values})
     select coalesce(string_agg(required.table_name, ',' order by required.table_name), '')
     from required
     left join information_schema.tables existing
       on existing.table_schema = 'public'
      and existing.table_name = required.table_name
     where existing.table_name is null"
)"

if [ -n "$missing_tables" ]; then
  echo "migration table assertion failed: missing ${missing_tables}" >&2
  exit 1
fi

echo "required migration tables ok"

required_extension_values="$(sql_values "${REQUIRED_EXTENSIONS[@]}")"
missing_extensions="$(
  docker exec "$CONTAINER_NAME" \
    psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
    "with required(extension_name) as (values ${required_extension_values})
     select coalesce(string_agg(required.extension_name, ',' order by required.extension_name), '')
     from required
     left join pg_extension installed
       on installed.extname = required.extension_name
     where installed.extname is null"
)"

if [ -n "$missing_extensions" ]; then
  echo "migration extension assertion failed: missing ${missing_extensions}" >&2
  exit 1
fi

echo "required migration extensions ok"

docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into source_runs(source_type, source_name, status)
      values ('official_api', 'Open Prices verifier', 'succeeded')" >/dev/null

if docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into source_runs(source_type, source_name, status)
      values ('unsupported_source', 'Unsupported verifier', 'succeeded')" >/dev/null 2>&1; then
  echo "source_runs source_type assertion failed: unsupported_source was accepted" >&2
  exit 1
fi

echo "source_runs official_api source type ok"

docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into app_users(id, email)
      values ('receipt-verifier-user', 'receipt-verifier@example.com')
      on conflict (id) do nothing" >/dev/null

docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into receipt_uploads(
        id, user_id, image_uri, purchased_at, total_amount, ocr_confidence, status, created_at, updated_at
      )
      values (
        'receipt-verifier-upload',
        'receipt-verifier-user',
        's3://groceryview-receipts/verifier.jpg',
        now(),
        42.50,
        0.8750,
        'uploaded',
        now(),
        now()
      )" >/dev/null

docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into receipt_items(id, receipt_id, raw_name, quantity, item_total, match_confidence)
      values ('receipt-verifier-item', 'receipt-verifier-upload', 'Verifier item', 1, 42.50, 0.8750)" >/dev/null

if docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into receipt_uploads(
        id, user_id, image_uri, purchased_at, total_amount, ocr_confidence, status, created_at, updated_at
      )
      values (
        'receipt-verifier-bad-status',
        'receipt-verifier-user',
        's3://groceryview-receipts/bad-status.jpg',
        now(),
        1.00,
        0.5000,
        'ignored',
        now(),
        now()
      )" >/dev/null 2>&1; then
  echo "receipt_uploads status assertion failed: ignored was accepted" >&2
  exit 1
fi

if docker exec "$CONTAINER_NAME" \
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
  -c "insert into receipt_items(id, receipt_id, raw_name, quantity, item_total, match_confidence)
      values ('receipt-verifier-bad-item', 'receipt-verifier-upload', 'Bad item', 0, 1.00, 0.5000)" >/dev/null 2>&1; then
  echo "receipt_items quantity assertion failed: zero quantity was accepted" >&2
  exit 1
fi

echo "receipt upload constraints ok"

if [ -d "$SEEDS_DIR" ]; then
  SEEDS=()
  while IFS= read -r seed; do
    SEEDS+=("$seed")
  done < <(find "$SEEDS_DIR" -maxdepth 1 -type f -name '*.sql' ! -name '._*.sql' | sort)
else
  SEEDS=()
fi

if [ "${#SEEDS[@]}" -gt 0 ]; then
  for seed in "${SEEDS[@]}"; do
    echo "applying $(basename "$seed")"
    docker exec -i "$CONTAINER_NAME" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 \
      < "$seed"
  done

  chains_count="$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from chains")"
  positioned_stores_count="$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from stores where position is not null")"
  products_count="$(docker exec "$CONTAINER_NAME" psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "select count(*) from products")"

  if [ "$chains_count" -lt 6 ] || [ "$positioned_stores_count" -lt 6 ] || [ "$products_count" -lt 20 ]; then
    echo "seed assertion failed: chains=$chains_count positioned_stores=$positioned_stores_count products=$products_count" >&2
    exit 1
  fi

  required_chain_values="$(sql_values "${REQUIRED_SEED_CHAIN_SLUGS[@]}")"
  missing_chain_slugs="$(
    docker exec "$CONTAINER_NAME" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
      "with required(slug) as (values ${required_chain_values})
       select coalesce(string_agg(required.slug, ',' order by required.slug), '')
       from required
       left join chains seeded on seeded.slug = required.slug
       where seeded.slug is null"
  )"

  required_store_values="$(sql_values "${REQUIRED_SEED_STORE_SLUGS[@]}")"
  missing_store_slugs="$(
    docker exec "$CONTAINER_NAME" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
      "with required(slug) as (values ${required_store_values})
       select coalesce(string_agg(required.slug, ',' order by required.slug), '')
       from required
       left join stores seeded
         on seeded.slug = required.slug
        and seeded.position is not null
       where seeded.slug is null"
  )"

  required_product_values="$(sql_values "${REQUIRED_SEED_PRODUCT_SLUGS[@]}")"
  missing_product_slugs="$(
    docker exec "$CONTAINER_NAME" \
      psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc \
      "with required(slug) as (values ${required_product_values})
       select coalesce(string_agg(required.slug, ',' order by required.slug), '')
       from required
       left join products seeded on seeded.slug = required.slug
       where seeded.slug is null"
  )"

  if [ -n "$missing_chain_slugs" ]; then
    echo "seed chain assertion failed: missing ${missing_chain_slugs}" >&2
    exit 1
  fi

  if [ -n "$missing_store_slugs" ]; then
    echo "seed store assertion failed: missing positioned stores ${missing_store_slugs}" >&2
    exit 1
  fi

  if [ -n "$missing_product_slugs" ]; then
    echo "seed product assertion failed: missing ${missing_product_slugs}" >&2
    exit 1
  fi

  echo "applied ${#SEEDS[@]} seed file(s); seed counts and required slugs ok"
else
  echo "no seed files found in $SEEDS_DIR; skipped seed verification"
fi
