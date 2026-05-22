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
- `METRICS_TOKEN`
- `GROCERYVIEW_SERVER_URL`
- `CATALOG_COVERAGE_TARGETS_JSON`

Check names without exposing values:

```bash
npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView
```

## Generate coverage targets from the live DB

Run this only after the production database has chains, stores, products, and latest
prices loaded far enough to represent the desired target universe.

```bash
DATABASE_URL="$DATABASE_URL" npm run ops:catalog-coverage-targets \
  > /tmp/catalog-coverage-targets.json
```

Review counts without dumping the full JSON:

```bash
node -e "const t=require('/tmp/catalog-coverage-targets.json'); console.log({products:t.targetProducts.length,categories:t.targetCategories.length,chains:t.targetChains,stores:t.targetStores.length,requireEveryProductInEveryStore:t.requireEveryProductInEveryStore})"
```

Store the compact JSON as `CATALOG_COVERAGE_TARGETS_JSON` in the deployment/GitHub secret store.
Every `targetStores[]` entry must also appear in the matching daily connector
`stores[]` metadata, otherwise ingestion cannot prove that product prices are
branch-scoped before it writes `latest_prices`.

## Export live branch metadata and connector config

Branch ids are fetched from public/native store catalogs where available:

- Willys: `https://www.willys.se/axfood/rest/store?online=true`
- Coop: `https://proxy.api.coop.se/external/store/stores?api-version=v5`, with
  store details from `/stores/{ledgerAccountNumber}`
- Lidl: `https://www.lidl.se/s/sv-SE/butiker/` store detail pages
- City Gross: `https://www.citygross.se/api/v1/PageData/stores`
- ICA: built from the checked-in ICA default store promotion configs

Generate connector-ready `stores[]` snippets:

```bash
npm run ops:daily-connector-stores > /tmp/daily-connector-stores.json
```

The daily ingestion workflow generates `GROCERYVIEW_DAILY_CONNECTORS_JSON` directly from the native connector exporter, so it is not a GitHub secret. To inspect the same generated config locally, run:

```bash
npm run --silent ops:daily-connectors > /tmp/groceryview-daily-connectors.json
```

Use this emitted JSON only for local `ops:validate-production-env` checks or one-off operator debugging when the workflow is not available.

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

## Trigger and monitor the daily gate

The scheduled workflow is `.github/workflows/daily-ingestion.yml`.

Manual trigger:

```bash
gh workflow run daily-ingestion.yml --repo SzeChunYiu/GroceryView
gh run list --workflow daily-ingestion.yml --repo SzeChunYiu/GroceryView --limit 5
```

The workflow must pass these gates in order:

1. DB and ingestion package tests
2. production ingestion configuration validator
3. configured daily ingestion runner
4. `/api/readiness/postgres`
5. `/api/readiness/source-runs`
6. `/api/readiness/catalog-coverage`

## Expected blocker meanings

- `source_run_missing_fresh_chain:<chain>`: no fresh successful daily source run for that chain.
- `source_run_insufficient_accepted_rows:<chain>:<count>/<min>`: source run completed but accepted too few rows.
- `missing_store_scoped_prices:<products>`: connector output had accepted products without a branch/store id.
- `unknown_store_ids:<stores>`: connector output referenced branch ids not declared in connector `stores[]`.
- `CATALOG_COVERAGE_TARGETS_JSON.targetStores missing from connector stores: <stores>`: production env has target branches that no daily connector declares.
- `backfill_product_store_pairs:<count>`: catalog coverage target requires product-store prices that are not in `latest_prices`.
- `backfill_chains:<chains>`: coverage targets include chains with no observed latest prices.
- `catalog_coverage_probe_failed`: readiness provider failed; check server logs without exposing secrets.

## Completion criteria

Do not treat the system as production-ready until all are true:

- `npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView` reports `ready`.
- `npm run ops:validate-production-env` reports `ready` in the deployment environment.
- the latest `daily-ingestion.yml` run passes.
- `/api/readiness/postgres`, `/api/readiness/source-runs`, and `/api/readiness/catalog-coverage` all return healthy/complete responses with HTTP 200.
