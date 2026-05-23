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
The daily workflow also exports this store enumeration before connector and target validation, fails closed with `store_enumeration_missing_chain:<chain>` or `store_enumeration_empty_chain:<chain>` if any required chain is absent or empty, and uploads the JSON as the `groceryview-daily-connector-stores` artifact for operator evidence.


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
- catalog coverage targets have non-empty product/category/chain/store arrays
- catalog target chains contain all six required chains
- `requireEveryProductInEveryStore` is `true`

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
reader returns no public latest-price rows, and with `db_site_snapshot_missing_required_chains:<chains>` when `postgres.latest_prices` lacks a public latest-price row for any required launch chain, and with `db_site_snapshot_missing_required_stores:<stores>` when the snapshot lacks latest-price evidence for any target store external ref exported in the catalog coverage targets, with `db_site_snapshot_missing_required_products:<products>` when any target product lacks latest-price evidence, with `db_site_snapshot_missing_required_store_price_types:<store:price-type>` when any target store lacks a required latest-price type, with `db_site_snapshot_missing_required_categories:<categories>` when any target category lacks latest-price evidence, and with `db_site_snapshot_stale_observations:<observation-ids>` when any exported latest-price row is older than `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS`. The artifact summarizes product, chain, store, observation, `requiredChains`, `missingRequiredChains`, `requiredStoreExternalRefs`, `missingRequiredStoreExternalRefs`, `requiredProductSlugs`, `missingRequiredProductSlugs`, `requiredPriceTypes`, `missingRequiredStorePriceTypes`, `requiredCategorySlugs`, `missingRequiredCategorySlugs`, `maxObservedAgeHours`, and `staleObservationCount` coverage and carries only the normalized public row plus provenance; it does not include raw private payloads. The daily ingestion workflow exports this snapshot after the ingestion write succeeds, checks that the artifact status is `passed` with at least one observation, zero missing required chains, zero missing required stores, zero missing required products, zero missing store price-type pairs, and zero missing required categories, and zero stale observations, and uploads it as the `groceryview-db-site-snapshot` artifact. Operators can tune the workflow export with `GROCERYVIEW_DB_SITE_SNAPSHOT_MIN_CONFIDENCE`, `GROCERYVIEW_DB_SITE_SNAPSHOT_LIMIT`, `GROCERYVIEW_DB_SITE_SNAPSHOT_MAX_OBSERVED_AGE_HOURS`, `GROCERYVIEW_DB_SITE_SNAPSHOT_REQUIRED_CHAINS`, and `GROCERYVIEW_DB_SITE_SNAPSHOT_CATALOG_TARGETS_JSON_FILE`.

## Trigger and monitor the daily gate

The scheduled workflow is `.github/workflows/daily-ingestion.yml`.

Manual trigger:

```bash
gh workflow run daily-ingestion.yml --repo SzeChunYiu/GroceryView
gh run list --workflow daily-ingestion.yml --repo SzeChunYiu/GroceryView --limit 5
```

The workflow must pass these gates in order:

1. DB and ingestion package tests
2. live store enumeration and `groceryview-daily-connector-stores` artifact upload
3. production ingestion configuration validator
4. configured daily ingestion runner; its `chainSummaries` must include every required chain, every summary must be `succeeded`, every official product connector must emit at least one observation for every configured branch in `stores[]`, and every required chain must emit at least one observation id before the workflow uploads `groceryview-daily-ingestion-result`
5. DB-backed site snapshot export and `groceryview-db-site-snapshot` artifact upload
6. `/api/readiness/postgres`
7. `/api/readiness/source-runs`
8. `/api/readiness/catalog-coverage`

## Expected blocker meanings

- `store_enumeration_missing_chain:<chain>`: store enumeration did not emit a `storesByChain` array for a required chain.
- `store_enumeration_empty_chain:<chain>`: store enumeration emitted no branches for a required chain, so connector and target validation cannot prove all-branch coverage.
- `daily_ingestion_missing_chain_summary:<chain>`: the daily runner JSON did not include a `chainSummaries` entry for a required chain.
- `daily_ingestion_chain_not_succeeded:<chain>`: at least one connector summary for that required chain did not finish with `status: succeeded`.
- `daily_ingestion_chain_without_observations:<chain>`: the required chain ran but produced no persisted observation ids in the daily runner result.
- `<chain>:missing_configured_store_observations:<stores>`: an official product connector fetched accepted rows but at least one configured branch in `stores[]` produced no observations, so the run stops before writing a partial branch-product snapshot.
- `source_run_missing_fresh_chain:<chain>`: no fresh successful daily source run for that chain.
- `source_run_insufficient_accepted_rows:<chain>:<count>/<min>`: source run completed but accepted too few rows.
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
- the latest `daily-ingestion.yml` run passes.
- `/api/readiness/postgres`, `/api/readiness/source-runs`, and `/api/readiness/catalog-coverage` all return healthy/complete responses with HTTP 200.
