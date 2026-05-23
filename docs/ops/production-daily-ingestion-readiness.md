# Production Daily Ingestion Readiness Runbook

This runbook is the operator path for enabling the daily ingestion objective:
DB ready, data ingested every day, all required chains covered, and product-by-store
coverage checked after every run.

## Required secrets

GitHub Actions / deployment must have these names configured:

- `AUTH_SECRET`
- `DATABASE_URL`
- `PUBLIC_WEB_URL`
- `NOTIFICATION_WEBHOOK_SECRET`
- `BILLING_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_PREMIUM_MONTHLY`
- `STRIPE_PRICE_PREMIUM_YEARLY`
- `METRICS_TOKEN`
- `GROCERYVIEW_SERVER_URL`
- `GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN`
- `CATALOG_COVERAGE_TARGETS_JSON`

Check names without exposing values:

```bash
npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView
```

## Generate coverage targets from the live DB

Run this only after the production database has chains and products, and after
`GROCERYVIEW_DAILY_CONNECTORS_JSON` has been generated from the live branch
catalogs. The store target universe comes from connector `stores[]` when present,
so unpriced branches remain readiness blockers instead of disappearing from the
target set.

```bash
DATABASE_URL="$DATABASE_URL" npm run ops:catalog-coverage-targets \
  > /tmp/catalog-coverage-targets.json
```

Review counts without dumping the full JSON:

```bash
node -e "const t=require('/tmp/catalog-coverage-targets.json'); console.log({products:t.targetProducts.length,categories:t.targetCategories.length,chains:t.targetChains,stores:t.targetStores.length,priceTypes:t.targetPriceTypes,requireEveryProductInEveryStore:t.requireEveryProductInEveryStore,requireEveryStorePriceType:t.requireEveryStorePriceType})"
```

Store the compact JSON as `CATALOG_COVERAGE_TARGETS_JSON` in the deployment/GitHub secret store.
Every `targetStores[]` entry must also appear in the matching daily connector
`stores[]` metadata, otherwise ingestion cannot prove that product prices are
branch-scoped before it writes `latest_prices`. The exported target also requires
`targetPriceTypes: ["online"]` and `requireEveryStorePriceType: true` so weekly
flyer promotions cannot satisfy branch branch-product-price readiness by themselves.

## Configure source-run row thresholds

Set `GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN` in the deployment/GitHub
secret store to the minimum accepted product rows required before
`/api/readiness/source-runs` treats a fresh daily source run as meaningful. The
value is compact JSON keyed by required chain id:

```json
{"ica":10,"willys":10,"coop":10,"hemkop":5,"lidl":5,"city_gross":5}
```

Production startup requires this value, and `ops:validate-production-env` fails
closed unless every required chain has a positive integer threshold. Raise these
numbers as launch catalogs grow; leaving them at `1` only proves connector liveness,
not product-volume readiness.

## Export live branch metadata and connector config

Branch ids are fetched from public/native store catalogs where available:

- Willys: `https://www.willys.se/axfood/rest/store?online=true`
- Coop: `https://proxy.api.coop.se/external/store/stores?api-version=v5`, with
  store details from `/stores/{ledgerAccountNumber}` for both product and weekly
  flyer campaign connectors
- Lidl: `https://www.lidl.se/s/sv-SE/butiker/` store detail pages
- City Gross: `https://www.citygross.se/api/v1/PageData/stores`
- ICA: built from the checked-in ICA default store promotion configs

Generate connector-ready `stores[]` snippets:

```bash
npm run --silent ops:daily-connector-stores > /tmp/daily-connector-stores.json
```

The daily ingestion workflow generates `GROCERYVIEW_DAILY_CONNECTORS_JSON` directly from the native connector exporter, so it is not a GitHub secret. To inspect the same generated config locally, run:

```bash
npm run --silent ops:daily-connectors > /tmp/groceryview-daily-connectors.json
```

Use this emitted JSON only for local `ops:validate-production-env` checks or one-off operator debugging when the workflow is not available.
The daily workflow also exports this store enumeration before connector and target validation, fails closed with `store_enumeration_missing_chain:<chain>` or `store_enumeration_empty_chain:<chain>` if any required chain is absent or empty, and always attempts to upload the JSON as the `groceryview-daily-connector-stores` artifact for operator evidence.


## Bounded bulk ingestion controls

The daily runner is a bounded bulk ingestion path: it loads the generated all-chain connector list, validates all six required chains, then lets operators control production fetch pressure without editing code. Use these environment variables for first-run backfills, rate-limit recovery, or canary batches:

- `GROCERYVIEW_DAILY_MAX_CONNECTORS`: optional canary cap after the generated config has proven all six required chains are present. Leave unset for full daily coverage.
- `GROCERYVIEW_DAILY_MAX_CONCURRENCY`: maximum connector fetch/parse/persist jobs at once. The workflow defaults to `2`.
- `GROCERYVIEW_DAILY_CONNECTOR_START_DELAY_MS`: polite delay before workers start later connectors. The workflow defaults to `250`.
- `GROCERYVIEW_DAILY_CONNECTOR_RETRY_ATTEMPTS`: connector-level retry attempts for transient fetch/parse failures. The workflow defaults to `1`.
- `GROCERYVIEW_DAILY_CONNECTOR_RETRY_BASE_DELAY_MS`: base retry backoff. The workflow defaults to `500`.

Do not leave `GROCERYVIEW_DAILY_MAX_CONNECTORS` set for normal production readiness: catalog coverage and source-run readiness still require all six required chains and all targeted product/store pairs.

## Validate values before relying on cron

Run from an environment that has the real values loaded. The workflow does this automatically; for a local operator check, write the generated connector JSON to a file and pass the file path so large all-store configs do not overflow process environment limits:

```bash
npm run --silent ops:daily-connectors > /tmp/groceryview-daily-connectors.json
GROCERYVIEW_DAILY_CONNECTORS_JSON_FILE=/tmp/groceryview-daily-connectors.json \
  npm run ops:validate-production-env
```

This fails closed unless:

- generated daily connector JSON has all six required chains: `ica`, `willys`, `coop`, `hemkop`, `lidl`, `city_gross`
- every store-scoped connector lists the branch metadata it can emit in `stores[]`
- catalog `targetStores[]` are covered by daily connector `stores[]`
- `GROCERYVIEW_SOURCE_RUN_MIN_ACCEPTED_ROWS_BY_CHAIN` has a positive integer threshold for all six required chains
- catalog coverage targets have non-empty product/category/chain/store arrays
- catalog target chains contain all six required chains
- `requireEveryProductInEveryStore` is `false`
- `requireEveryStorePriceType` is `true`

## Export a DB-backed site snapshot

After daily ingestion has written verified rows into `postgres.latest_prices`, export
the public static-site snapshot artifact from the database instead of refreshing
checked-in per-source fixtures:

```bash
DATABASE_URL="$DATABASE_URL" \
GROCERYVIEW_DB_SITE_SNAPSHOT_PATH=/tmp/groceryview-db-site-snapshot.json \
GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS=ica,willys,coop,hemkop,lidl,city_gross \
GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS=36 \
GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE=/tmp/groceryview-catalog-targets.json \
npm run --silent ingest:export-db-snapshot
```

The exporter fails closed with `No latest price rows available` when the database
reader returns no public latest-price rows, and with `db_site_snapshot_missing_required_chains:<chains>` when `postgres.latest_prices` lacks a public latest-price row for any required launch chain, and with `db_site_snapshot_missing_required_stores:<stores>` when the snapshot lacks latest-price evidence for any target store external ref exported in the catalog coverage targets, with `db_site_snapshot_missing_required_products:<products>` when any target product lacks latest-price evidence, with `db_site_snapshot_missing_required_store_price_types:<store:price-type>` when any target store lacks a required latest-price type, with `db_site_snapshot_missing_required_categories:<categories>` when any target category lacks latest-price evidence, and with `db_site_snapshot_stale_observations:<observation-ids>` when any exported latest-price row is older than `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS`. The artifact summarizes product, chain, store, observation, `requiredChains`, `missingRequiredChains`, `requiredStoreExternalRefs`, `missingRequiredStoreExternalRefs`, `requiredProductSlugs`, `missingRequiredProductSlugs`, `requiredPriceTypes`, `missingRequiredStorePriceTypes`, `requiredCategorySlugs`, `missingRequiredCategorySlugs`, `maxObservedAgeHours`, and `staleObservationCount` coverage and carries only the normalized public row plus provenance; it does not include raw private payloads. The daily ingestion workflow exports this snapshot after the ingestion write succeeds, checks that the artifact status is `passed` with at least one observation, zero missing required chains, zero missing required stores, zero missing required products, zero missing store price-type pairs, and zero missing required categories, and zero stale observations, and uploads it and the `db-site-snapshot-result.json` command summary as the `groceryview-db-site-snapshot` artifact. Operators can tune the workflow export with `GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE`, `GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT`, `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS`, `GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS`, and `GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE`.

## Trigger and monitor the daily gate

The scheduled workflow is `.github/workflows/daily-ingestion.yml`.

Manual trigger:

```bash
gh workflow run daily-ingestion.yml --repo SzeChunYiu/GroceryView
gh run list --workflow daily-ingestion.yml --repo SzeChunYiu/GroceryView --limit 5
```

The workflow must pass these gates in order:

1. production configuration preflight and always-attempted `groceryview-production-config-preflight` artifact upload with non-secret missing-key diagnostics; missing required values fail with `production_config_preflight_missing`
2. DB and ingestion package tests
3. live store enumeration and always-attempted `groceryview-daily-connector-stores` artifact upload for success or failure diagnostics
4. production ingestion configuration validator and always-attempted `groceryview-production-ingestion-config` artifact upload with `production-env-validation.json`, `groceryview-catalog-targets.json`, and `groceryview-daily-connectors.json` for success or failure diagnostics
5. production DB write connectivity diagnostic and always-attempted `groceryview-daily-db-connectivity` artifact upload; if the diagnostic command exits before writing JSON, the workflow writes a fail-closed `daily_db_connectivity_diagnostic_missing` artifact instead of silently ignoring the missing evidence
6. production DB migration application and always-attempted `groceryview-production-db-migrations` artifact upload; if the migration command exits before writing JSON, the workflow writes a fail-closed `production_db_migrations_diagnostic_missing` artifact instead of silently ignoring missing schema evidence
7. configured daily ingestion runner; its `chainSummaries` must include every required chain, every summary must be `succeeded`, every official product connector must emit at least one observation for every configured branch in `stores[]`, every required chain must emit at least one observation id, and the workflow always attempts to upload `groceryview-daily-ingestion-result` for success or failure diagnostics; if the runner exits before writing JSON, the workflow writes a fail-closed `daily_ingestion_result_diagnostic_missing` artifact instead of silently losing the run evidence
8. DB-backed site snapshot export and always-attempted `groceryview-db-site-snapshot` artifact upload with `groceryview-db-site-snapshot.json` and `db-site-snapshot-result.json` for success or failure diagnostics; if the export command exits before writing the result JSON, the workflow writes a fail-closed `db_site_snapshot_result_diagnostic_missing` payload with the command exit code
9. always-attempted `/api/readiness/postgres`, including a target match against the daily DB connectivity diagnostic; if that diagnostic was not produced, the workflow fails with `postgres_readiness_missing_ingestion_connectivity_diagnostic`
10. always-attempted `/api/readiness/source-runs`, including zero blockers, zero missing fresh chains, zero insufficient accepted-row blockers, at least six succeeded daily source-run evidence entries, and a latest successful finish timestamp
11. always-attempted `/api/readiness/catalog-coverage`, including zero missing chain, store, product, category, price-type, product-store pair, and store-price-type gaps
12. upload `groceryview-deployed-readiness` with `postgres-readiness.json`, `source-run-readiness.json`, and `catalog-coverage-readiness.json`

## Expected blocker meanings

- `store_enumeration_missing_chain:<chain>`: store enumeration did not emit a `storesByChain` array for a required chain.
- `production_config_preflight_missing`: required production secret or variable names were absent before package installation and connector generation; inspect `groceryview-production-config-preflight` for the non-secret missing-key list.
- `store_enumeration_empty_chain:<chain>`: store enumeration emitted no branches for a required chain, so connector and target validation cannot prove all-branch coverage.
- `daily_ingestion_result_diagnostic_missing`: the configured daily ingestion runner failed before writing its result JSON payload; inspect the `groceryview-daily-ingestion-result` artifact for the command exit code.
- `daily_ingestion_missing_chain_summary:<chain>`: the daily runner JSON did not include a `chainSummaries` entry for a required chain.
- `daily_ingestion_chain_not_succeeded:<chain>`: at least one connector summary for that required chain did not finish with `status: succeeded`.
- `daily_ingestion_chain_without_observations:<chain>`: the required chain ran but produced no persisted observation ids in the daily runner result.
- `<chain>:missing_configured_store_observations:<stores>`: an official product connector fetched accepted rows but at least one configured branch in `stores[]` produced no observations, so the run stops before writing a partial branch-product snapshot.
- `<chain>:persistence_failed:<message>`: connector output could not be written to `source_runs`, `raw_records`, `observations`, or `latest_prices`; if the source run was already created, ingestion marks that source run `failed` with the sanitized error message instead of leaving it stuck as `running`.
- `db_site_snapshot_result_diagnostic_missing`: DB-backed site snapshot export failed before writing `db-site-snapshot-result.json`; inspect the `groceryview-db-site-snapshot` artifact for the command exit code.
- `source_run_missing_fresh_chain:<chain>`: no fresh successful daily source run for that chain.
- `source_run_insufficient_accepted_rows:<chain>:<count>/<min>`: source run completed but accepted too few rows.
- `daily_db_connectivity_diagnostic_missing`: the production DB connectivity command failed before writing a diagnostic JSON payload; inspect the `groceryview-daily-db-connectivity` artifact for the command exit code.
- `production_db_migrations_diagnostic_missing`: the production DB migration command failed before writing a diagnostic JSON payload; inspect the `groceryview-production-db-migrations` artifact for the command exit code.
- `postgres_readiness_missing_ingestion_connectivity_diagnostic`: deployed PostgreSQL readiness was probed, but the daily DB connectivity diagnostic was not available for target matching.
- `missing_store_scoped_prices:<products>`: connector output had accepted products without a branch/store id.
- `unknown_store_ids:<stores>`: connector output referenced branch ids not declared in connector `stores[]`.
- `CATALOG_COVERAGE_TARGETS_JSON.targetStores missing from connector stores: <stores>`: production env has target branches that no daily connector declares.
- `backfill_product_store_pairs:<count>`: catalog coverage target requires product-store prices that are not in `latest_prices`.
- `backfill_price_types:<types>`: catalog coverage target requires price types, such as `online`, that are not present in `latest_prices`.
- `backfill_store_price_types:<count>`: target branches are missing one or more required price types, so promotion-only stores do not count as branch-product-price ready.
- `backfill_chains:<chains>`: coverage targets include chains with no observed latest prices.
- `catalog_coverage_probe_failed`: readiness provider failed; check server logs without exposing secrets.

## Completion criteria

Do not treat the system as production-ready until all are true:

- `npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView` reports `ready`.
- `npm run ops:validate-production-env` reports `ready` in the deployment environment.
- the latest `daily-ingestion.yml` run passes and includes the always-attempted `groceryview-production-config-preflight`, `groceryview-daily-connector-stores`, `groceryview-production-ingestion-config`, `groceryview-daily-db-connectivity`, `groceryview-production-db-migrations`, `groceryview-daily-ingestion-result`, `groceryview-db-site-snapshot`, and `groceryview-deployed-readiness` artifacts, with `groceryview-daily-ingestion-result` preserving `daily_ingestion_result_diagnostic_missing` diagnostics when the runner fails before writing normal JSON and `groceryview-db-site-snapshot` preserving both `db_site_snapshot_result_diagnostic_missing` command-failure diagnostics and `db-site-snapshot-result.json` coverage diagnostics when export validation fails after files are written.
- `/api/readiness/postgres`, `/api/readiness/source-runs`, and `/api/readiness/catalog-coverage` all return healthy/complete responses with HTTP 200; source-run readiness has zero blockers, zero missing fresh chains, zero insufficient accepted-row blockers, at least six succeeded evidence entries, and a latest successful finish timestamp; and catalog coverage has no missing dimension, product-store-pair, or store-price-type gaps.
