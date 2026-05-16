# DB Schema Tasks — PostgreSQL lane

Owner lane: `db-schema`  
Writable paths: `infra/db/`, `infra/docker-compose.yml`, `packages/db/`, db handoff file.

## Numbered implementation checklist

1. [ ] Check repo state before editing.
   - Run: `cd /projects/hep/fs10/shared/nnbar/billy/GroceryView && git status --short --branch`
2. [ ] Create a lane branch.
   - Run: `git checkout -b db-schema/initial-schema`
3. [ ] Create database directories.
   - Run: `mkdir -p infra/db/migrations infra/db/seeds packages/db/src`
4. [ ] Create local database compose file.
   - Path: `infra/docker-compose.yml`
   - Services: `postgres` using image `postgis/postgis:18-3.6` mapped to `5432:5432`, `redis` using image `redis:7-alpine` mapped to `6379:6379`, optional `pgadmin` using image `dpage/pgadmin4:latest` mapped to `5050:80`, and `minio` using image `minio/minio:latest` mapped to `9000:9000` and `9001:9001`.
   - Postgres env: `POSTGRES_DB=groceryview`, `POSTGRES_USER=groceryview`, `POSTGRES_PASSWORD=groceryview`.
   - Create root `.env.example` with `DATABASE_URL=postgresql://groceryview:groceryview@localhost:5432/groceryview`, `REDIS_URL=redis://localhost:6379`, `PGADMIN_DEFAULT_EMAIL=admin@groceryview.local`, `PGADMIN_DEFAULT_PASSWORD=groceryview`, `S3_ENDPOINT=http://localhost:9000`, and `S3_BUCKET=groceryview-raw`.
   - Add comments in `infra/docker-compose.yml` or `infra/README.md` telling worker lanes to use this compose file for local development against a real DB.
5. [ ] Create initial extension migration.
   - Path: `infra/db/migrations/001_extensions.sql`
   - Include: `CREATE EXTENSION IF NOT EXISTS postgis;`, `CREATE EXTENSION IF NOT EXISTS pg_trgm;`, `CREATE EXTENSION IF NOT EXISTS btree_gist;`.
6. [ ] Create core schema migration.
   - Path: `infra/db/migrations/002_init.sql`
   - Define enums or check constraints for price type, source type, confidence band, alert status, and observation status.
   - Define tables: `cities`, `chains`, `stores`, `products`, `product_aliases`, `product_equivalence_groups`, `product_equivalence_members`, `source_runs`, `source_records_raw`, `price_observations`, `promotion_observations`, `latest_store_prices`, `price_series_daily`, `index_snapshots`, `users`, `favorite_stores`, `watchlist_items`, `weekly_baskets`, `basket_items`, `budgets`, `alerts`, `alert_deliveries`, `receipt_uploads`, `receipt_line_items`, `shelf_photo_reports`, `moderation_queue`.
   - Use `numeric(12,2)` for SEK prices and preserve unit prices separately.
   - Store geometry: `stores.location geography(Point, 4326)`.
   - Include provenance columns: `source_type`, `source_url`, `source_run_id`, `raw_record_id`, `observed_at`, `parser_version`, `confidence_score`.
7. [ ] Create indexes migration.
   - Path: `infra/db/migrations/003_indexes.sql`
   - Required indexes: `stores` GiST on `location`, `products` GIN trigram on `name`, `product_aliases` trigram on `alias`, `price_observations(product_id, city_id, observed_at DESC)`, `price_observations(store_id, observed_at DESC)`, `promotion_observations(product_id, promo_start, promo_end)`, `latest_store_prices(product_id, store_id)`, `watchlist_items(user_id, product_id)`, `basket_items(weekly_basket_id, product_id)`.
8. [ ] Add partitioning notes or implementation.
   - If implementing partitions now, partition `price_observations` monthly by `observed_at`.
   - If deferring partitions, document the exact next migration pattern in `infra/db/SCHEMA.md`.
9. [ ] Create seed data migration or seed script.
   - Path: `infra/db/seeds/001_stockholm_seed.sql`
   - Insert city `Stockholm`, chains `ICA`, `Willys`, `Coop`, `Hemköp`, `Lidl`, `City Gross`.
   - Insert at least 20 hero product rows matching `PROPOSAL.md`: milk, eggs, butter, coffee, chicken, minced beef, pasta, rice, bread, cheese, bananas, tomatoes, potatoes, toilet paper, detergent, diapers, oat milk, yogurt, olive oil, frozen pizza.
10. [ ] Write schema documentation.
    - Path: `infra/db/SCHEMA.md`
    - Document every table, primary key, important foreign key, price/provenance semantics, confidence labels, and why travel time is not in Deal Score ranking.
11. [ ] Optionally create `packages/db` for shared SQL access.
    - Path: `packages/db/package.json`, name `@groceryview/db`.
    - Include dependency package names if used: `drizzle-orm`, `postgres`, `zod`.
    - Do not block the SQL migration PR on ORM setup if API lane has not chosen the integration.
12. [ ] Validate SQL.
    - Run: `docker compose -f infra/docker-compose.yml up -d postgres`
    - Run: `for f in infra/db/migrations/*.sql infra/db/seeds/*.sql; do docker compose -f infra/docker-compose.yml exec -T postgres psql -U groceryview -d groceryview -v ON_ERROR_STOP=1 -f - < "$f"; done`
    - Run: `docker compose -f infra/docker-compose.yml down`
13. [ ] Write handoff.
    - Path: `docs/parallel-sessions/handoff-db-schema.md`
    - Include validation output, schema decisions, deferred partitions/materialized views, and next task.
14. [ ] Commit and open PR.
    - Run: `git add infra/db infra/docker-compose.yml docs/parallel-sessions/handoff-db-schema.md`
    - If `packages/db` exists, run: `git add packages/db`
    - Run: `git commit -m "feat(db): add initial GroceryView schema"`
    - Run: `git push -u origin db-schema/initial-schema`
    - Run: `GH_CONFIG_DIR=/projects/hep/fs10/shared/nnbar/billy/.config/gh /projects/hep/fs10/shared/nnbar/billy/bin/gh pr create --title "feat(db): add initial GroceryView schema" --body "Adds PostgreSQL/PostGIS schema, indexes, seed data, and schema documentation." --base main`
