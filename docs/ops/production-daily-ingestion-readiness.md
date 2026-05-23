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

When the production blocker is specifically database recovery or replacement
cutover, use a focused scope so unrelated deploy/mobile/scanner secrets do not
hide the actionable DB prerequisites:

```bash
npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView --scope db-recovery
npm run ops:check-production-secrets -- --repo SzeChunYiu/GroceryView --scope db-cutover
```

`db-recovery` is ready only when `SUPABASE_ACCESS_TOKEN` and
`SUPABASE_PROJECT_REF` are available. `db-cutover` is ready only when the current
`DATABASE_URL` plus either `REPLACEMENT_DATABASE_URL` or `CANDIDATE_DATABASE_URL`
are configured; the full `all` scope remains the default production-wide gate.

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

When `DATABASE_URL` points at a Supabase pooler host and the primary write probe
fails, `ops:check-daily-db-connectivity` also records `alternateConnections[]`
entries named `supabase_transaction_pooler` and `supabase_direct_host` when they
can be derived. Operators can tune
`GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS` and
`GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS` in the daily workflow variables
(default `1`) to retry those proofs before deciding whether to switch
`DATABASE_URL` to the direct host, keep waiting on pooler recovery, or continue
replacement DB cutover.

When connectivity still fails, the daily workflow tries to generate a redacted
`groceryview-production-db-recovery-packet` artifact with
`npm run --silent ops:db-recovery-packet`. Configure `SUPABASE_ACCESS_TOKEN` and
`SUPABASE_PROJECT_REF` so failed readiness runs can attach Supabase service
health, management SQL probe status, and cutover/recovery actions without
dumping database credentials. If those values are absent, the artifact is still
written with `production_db_recovery_packet_missing_credentials` so operators can
fix the evidence gap before retrying.

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


## Replacement DB cutover validation

Use this path when the current production `DATABASE_URL` is unhealthy, not
accepting writes, or blocked by provider recovery. Do **not** update the
production `DATABASE_URL` secret until the replacement database has passed the
full cutover validation workflow.

Required candidate secret, exactly one of:

- `REPLACEMENT_DATABASE_URL`
- `CANDIDATE_DATABASE_URL`

The candidate must be a distinct writable database URL. The validator rejects a
candidate that matches the current production `DATABASE_URL` after credentials
are stripped, and it redacts all connection strings in artifacts.

Manual trigger:

```bash
gh workflow run db-cutover-validation.yml --repo SzeChunYiu/GroceryView --ref main
gh run list --workflow db-cutover-validation.yml --repo SzeChunYiu/GroceryView --limit 5
```

The workflow is `.github/workflows/db-cutover-validation.yml` and must pass these
gates before a production cutover is allowed:

1. `ops:validate-db-cutover` proves the replacement DB accepts write-mode and
   `select 1` connectivity.
2. `ops:apply-db-migrations` applies the canonical schema to the replacement DB
   and uploads `groceryview-replacement-db-migrations`; if the downstream
   migration step unexpectedly loses its resolved database URL after candidate
   validation, it writes `replacement_database_url_config_missing` before failing.
3. the generated all-chain daily connector config is run against the replacement
   DB; if this downstream ingestion step unexpectedly loses its resolved database
   URL after candidate validation, it writes
   `replacement_ingestion_database_url_config_missing` to each ingestion evidence
   file before failing. If connector generation fails before JSON, the workflow
   writes `replacement_daily_connectors_diagnostic_missing`, if catalog target
   generation fails before JSON, it writes `replacement_catalog_targets_diagnostic_missing`,
   otherwise `chainSummaries` must include `ica`, `willys`, `coop`, `hemkop`,
   `lidl`, and `city_gross`, every summary must be `succeeded`, and every
   required chain must have at least one persisted observation.
4. `ingest:export-db-snapshot` exports a replacement DB-backed site snapshot with
   all required chains, stores, products, categories, and price types covered; if
   the downstream snapshot step unexpectedly loses its resolved database URL, it
   writes `replacement_snapshot_database_url_config_missing` to the snapshot
   evidence before failing.
5. artifacts `groceryview-db-cutover-validation`,
   `groceryview-replacement-db-migrations`, `groceryview-replacement-db-ingestion`,
   and `groceryview-replacement-db-site-snapshot` are available for review, and
   each upload fails if its expected evidence file is missing.

Expected replacement DB blockers:

- `replacement_database_url_missing`: neither `REPLACEMENT_DATABASE_URL` nor
  `CANDIDATE_DATABASE_URL` is configured. Create a distinct writable database,
  store its connection string as one of those repository secrets, and rerun the
  cutover workflow.
- `replacement_database_url_matches_current_database_url`: the candidate is the
  current production DB, so it is not a safe cutover target.
- `replacement_database_not_writable`: the candidate exists but does not prove
  write-mode connectivity.
- `replacement_database_url_config_missing`: the candidate passed initial URL
  validation, but the downstream migration step did not receive the resolved
  database URL, so the workflow preserved migration evidence and failed closed.
- `replacement_ingestion_database_url_config_missing`: the candidate passed
  initial URL validation, but the downstream all-store ingestion step did not
  receive the resolved database URL, so the workflow preserved ingestion evidence
  and failed closed before writing to an unknown target.
- `replacement_snapshot_database_url_config_missing`: the candidate passed
  initial URL validation, but the downstream DB-backed site snapshot step did not
  receive the resolved database URL, so the workflow preserved snapshot evidence
  and failed closed before reading from an unknown target.
- `replacement_db_migrations_diagnostic_missing`: migration application failed
  before producing its normal JSON evidence.
- `replacement_daily_connectors_diagnostic_missing`: replacement all-store
  ingestion validation could not generate daily connector JSON before starting.
- `replacement_catalog_targets_diagnostic_missing`: replacement all-store
  ingestion validation could not generate catalog target JSON before starting.
- `replacement_daily_ingestion_missing_chain_summary:<chain>`: the all-store
  replacement ingestion run did not report a required chain.
- `replacement_daily_ingestion_chain_not_succeeded:<chain>:<status>`: a required
  chain did not complete successfully on the replacement DB.
- `replacement_daily_ingestion_chain_without_observations:<chain>`: a required
  chain completed without persisted latest-price observations.
- `replacement_db_site_snapshot_without_observations`: the replacement DB-backed
  site snapshot found no latest-price observations.

Only after this workflow passes should operators copy the already-validated
candidate value into the production `DATABASE_URL` secret, rerun the production
Daily ingestion readiness workflow, and require the normal deployed readiness
artifacts to pass.

## Trigger and monitor the daily gate

The scheduled workflow is `.github/workflows/daily-ingestion.yml`.

Manual trigger:

```bash
gh workflow run daily-ingestion.yml --repo SzeChunYiu/GroceryView
gh run list --workflow daily-ingestion.yml --repo SzeChunYiu/GroceryView --limit 5
```

The workflow must pass these gates in order:

1. production configuration preflight and always-attempted `groceryview-production-config-preflight` artifact upload with non-secret missing-key diagnostics; missing required values fail with `production_config_preflight_missing`, and if preflight exits before writing JSON, the workflow writes a fail-closed `production_config_preflight_diagnostic_missing` payload with the command exit code instead of relying on an upload-only failure
2. DB and ingestion package tests
3. live store enumeration and always-attempted `groceryview-daily-connector-stores` artifact upload for success or failure diagnostics; if the enumeration command exits before writing JSON, the workflow writes a fail-closed `store_enumeration_diagnostic_missing` payload with the command exit code
4. production ingestion configuration validator and always-attempted `groceryview-production-ingestion-config` artifact upload with `production-env-validation.json`, `groceryview-catalog-targets.json`, and `groceryview-daily-connectors.json` for success or failure diagnostics; if daily connector generation exits before writing JSON, the workflow writes a fail-closed `daily_connectors_diagnostic_missing` payload with the command exit code, if catalog target generation exits before writing JSON, it writes a fail-closed `catalog_targets_diagnostic_missing` payload with the command exit code, and if production env validation exits before writing JSON, it writes a fail-closed `production_env_validation_diagnostic_missing` payload with the command exit code
5. production DB write connectivity diagnostic and always-attempted `groceryview-daily-db-connectivity` artifact upload; if this downstream step unexpectedly loses `DATABASE_URL` after preflight, it writes `daily_db_connectivity_database_url_config_missing`, if a Supabase pooler probe fails but alternate endpoints can be derived, the artifact includes `alternateConnections[]` with `supabase_transaction_pooler` and/or `supabase_direct_host`, and if the diagnostic command exits before writing JSON, the workflow writes a fail-closed `daily_db_connectivity_diagnostic_missing` artifact instead of silently ignoring the missing evidence
6. on DB-connectivity failure, a `groceryview-production-db-recovery-packet` artifact upload with redacted Supabase project health, management SQL probe status, and recommended cutover/recovery actions from `ops:db-recovery-packet`; if management credentials are unavailable, the workflow writes `production_db_recovery_packet_missing_credentials`, and if the packet command exits before writing JSON, it writes `production_db_recovery_packet_diagnostic_missing`
7. production DB migration application and always-attempted `groceryview-production-db-migrations` artifact upload; if this downstream step unexpectedly loses `DATABASE_URL` after preflight, it writes `production_db_migrations_database_url_config_missing`, and if the migration command exits before writing JSON, the workflow writes a fail-closed `production_db_migrations_diagnostic_missing` artifact instead of silently ignoring missing schema evidence, and if an earlier failure skips the migration step entirely, the upload still preserves `production_db_migrations_skipped_after_prior_failure`
8. configured daily ingestion runner; its `chainSummaries` must include every required chain, every summary must be `succeeded`, every official product connector must emit at least one observation for every configured branch in `stores[]`, every required chain must emit at least one observation id, and the workflow always attempts to upload `groceryview-daily-ingestion-result` for success or failure diagnostics; if this downstream step unexpectedly loses `DATABASE_URL` after preflight, it writes `daily_ingestion_database_url_config_missing` to the result artifact and blocker log, if connector generation inside the runner step exits before ingestion starts, the workflow writes a fail-closed `daily_ingestion_connectors_diagnostic_missing` result and blocker log, and if the runner exits before writing JSON, it writes a fail-closed `daily_ingestion_result_diagnostic_missing` artifact instead of silently losing the run evidence, and if an earlier failure skips the runner entirely, the upload still preserves `daily_ingestion_skipped_after_prior_failure` in both the JSON result and blocker log
9. DB-backed site snapshot export and always-attempted `groceryview-db-site-snapshot` artifact upload with `groceryview-db-site-snapshot.json` and `db-site-snapshot-result.json` for success or failure diagnostics; if this downstream step unexpectedly loses `DATABASE_URL` after preflight, it writes `db_site_snapshot_database_url_config_missing` to both snapshot evidence files, and if the export command exits before writing the result JSON, the workflow writes a fail-closed `db_site_snapshot_result_diagnostic_missing` payload with the command exit code, and if an earlier failure skips snapshot export entirely, the upload still preserves `db_site_snapshot_skipped_after_prior_failure` in both snapshot files
10. always-attempted `/api/readiness/postgres`, including non-secret `postgres_readiness_config_missing` config diagnostics before curl, a fail-closed `postgres_readiness_diagnostic_missing` payload when curl exits before writing JSON, and a target match against the daily DB connectivity diagnostic; if that diagnostic was not produced, the workflow fails with `postgres_readiness_missing_ingestion_connectivity_diagnostic`
11. always-attempted `/api/readiness/source-runs`, including non-secret `source_run_readiness_config_missing` config diagnostics before curl, a fail-closed `source_run_readiness_diagnostic_missing` payload when curl exits before writing JSON, zero blockers, zero missing fresh chains, zero insufficient accepted-row blockers, at least six succeeded daily source-run evidence entries, and a latest successful finish timestamp
12. always-attempted `/api/readiness/catalog-coverage`, including non-secret `catalog_coverage_readiness_config_missing` config diagnostics before curl, a fail-closed `catalog_coverage_readiness_diagnostic_missing` payload when curl exits before writing JSON, and zero missing chain, store, product, category, price-type, product-store pair, and store-price-type gaps
13. upload `groceryview-deployed-readiness` with `postgres-readiness.json`, `source-run-readiness.json`, and `catalog-coverage-readiness.json`, failing the upload if any of those three evidence files is missing

## Expected blocker meanings

- `store_enumeration_diagnostic_missing`: live store enumeration failed before writing its normal JSON payload; inspect `groceryview-daily-connector-stores` for the command exit code.
- `store_enumeration_missing_chain:<chain>`: store enumeration did not emit a `storesByChain` array for a required chain.
- `production_config_preflight_missing`: required production secret or variable names were absent before package installation and connector generation; inspect `groceryview-production-config-preflight` for the non-secret missing-key list.
- `production_config_preflight_diagnostic_missing`: production configuration preflight failed before writing its normal JSON payload; inspect `groceryview-production-config-preflight` for the command exit code.
- `store_enumeration_empty_chain:<chain>`: store enumeration emitted no branches for a required chain, so connector and target validation cannot prove all-branch coverage.
- `daily_connectors_diagnostic_missing`: daily connector generation failed before writing `groceryview-daily-connectors.json`; inspect `groceryview-production-ingestion-config` for the command exit code.
- `catalog_targets_diagnostic_missing`: catalog coverage target generation failed before writing `groceryview-catalog-targets.json`; inspect `groceryview-production-ingestion-config` for the command exit code.
- `production_env_validation_diagnostic_missing`: production environment validation failed before writing `production-env-validation.json`; inspect `groceryview-production-ingestion-config` for the command exit code.
- `daily_db_connectivity_database_url_config_missing`: production config preflight passed, but the downstream DB connectivity step did not receive `DATABASE_URL`; inspect `groceryview-daily-db-connectivity` for the preserved config blocker.
- `production_db_migrations_database_url_config_missing`: production config preflight passed, but the downstream DB migration step did not receive `DATABASE_URL`; inspect `groceryview-production-db-migrations` for the preserved config blocker.
- `daily_ingestion_database_url_config_missing`: production config preflight passed, but the downstream ingestion runner step did not receive `DATABASE_URL`; inspect `groceryview-daily-ingestion-result` and the blocker log before retrying.
- `daily_ingestion_connectors_diagnostic_missing`: the daily ingestion step could not regenerate connector JSON before starting the runner; inspect the `groceryview-daily-ingestion-result` artifact and blocker log for the command exit code.
- `daily_ingestion_result_diagnostic_missing`: the configured daily ingestion runner failed before writing its result JSON payload; inspect the `groceryview-daily-ingestion-result` artifact for the command exit code.
- `daily_ingestion_skipped_after_prior_failure`: an earlier fail-closed gate stopped the runner before it could execute; the workflow still uploaded the result JSON and blocker log.
- `daily_ingestion_missing_chain_summary:<chain>`: the daily runner JSON did not include a `chainSummaries` entry for a required chain.
- `daily_ingestion_chain_not_succeeded:<chain>`: at least one connector summary for that required chain did not finish with `status: succeeded`.
- `daily_ingestion_chain_without_observations:<chain>`: the required chain ran but produced no persisted observation ids in the daily runner result.
- `<chain>:missing_configured_store_observations:<stores>`: an official product connector fetched accepted rows but at least one configured branch in `stores[]` produced no observations, so the run stops before writing a partial branch-product snapshot.
- `<chain>:persistence_failed:<message>`: connector output could not be written to `source_runs`, `raw_records`, `observations`, or `latest_prices`; if the source run was already created, ingestion marks that source run `failed` with the sanitized error message instead of leaving it stuck as `running`.
- `db_site_snapshot_database_url_config_missing`: production config preflight passed, but the downstream DB-backed site snapshot step did not receive `DATABASE_URL`; inspect `groceryview-db-site-snapshot` for the preserved config blocker.
- `db_site_snapshot_result_diagnostic_missing`: DB-backed site snapshot export failed before writing `db-site-snapshot-result.json`; inspect the `groceryview-db-site-snapshot` artifact for the command exit code.
- `db_site_snapshot_skipped_after_prior_failure`: an earlier fail-closed gate stopped snapshot export before it could execute; the workflow still uploaded both snapshot evidence files.
- `source_run_missing_fresh_chain:<chain>`: no fresh successful daily source run for that chain.
- `source_run_insufficient_accepted_rows:<chain>:<count>/<min>`: source run completed but accepted too few rows.
- `daily_db_connectivity_diagnostic_missing`: the production DB connectivity command failed before writing a diagnostic JSON payload; inspect the `groceryview-daily-db-connectivity` artifact for the command exit code.
- `supabase_transaction_pooler`: an alternate `alternateConnections[]` entry proving whether the original Supabase transaction-pooler endpoint accepts writes when the session-pooler rewrite fails; tune `GROCERYVIEW_DAILY_DB_ALTERNATE_POOLER_PROBE_ATTEMPTS` if provider startup is flapping.
- `supabase_direct_host`: an alternate `alternateConnections[]` entry proving whether the direct Supabase DB host accepts writes when the pooler path fails; tune `GROCERYVIEW_DAILY_DB_DIRECT_PROBE_ATTEMPTS` if provider startup is flapping.
- `production_db_recovery_packet_missing_credentials`: DB connectivity failed, but the workflow could not call Supabase management APIs because `SUPABASE_ACCESS_TOKEN` or `SUPABASE_PROJECT_REF` was absent; inspect `groceryview-production-db-recovery-packet` and configure the missing value before the next failure.
- `production_db_recovery_packet_diagnostic_missing`: the recovery-packet command failed before writing JSON; inspect `groceryview-production-db-recovery-packet` for the command exit code.
- `production_db_migrations_diagnostic_missing`: the production DB migration command failed before writing a diagnostic JSON payload; inspect the `groceryview-production-db-migrations` artifact for the command exit code.
- `production_db_migrations_skipped_after_prior_failure`: an earlier fail-closed gate stopped migration execution; the workflow still uploaded a structured migration artifact so the run evidence is complete.
- `postgres_readiness_config_missing`: deployed PostgreSQL readiness could not be probed because `GROCERYVIEW_SERVER_URL` or `METRICS_TOKEN` was missing; inspect `groceryview-deployed-readiness` for the non-secret missing-key list.
- `postgres_readiness_diagnostic_missing`: deployed PostgreSQL readiness curl failed before writing JSON; inspect `groceryview-deployed-readiness` for the curl exit code.
- `source_run_readiness_config_missing`: deployed source-run readiness could not be probed because `GROCERYVIEW_SERVER_URL` or `METRICS_TOKEN` was missing; inspect `groceryview-deployed-readiness` for the non-secret missing-key list.
- `source_run_readiness_diagnostic_missing`: deployed source-run readiness curl failed before writing JSON; inspect `groceryview-deployed-readiness` for the curl exit code.
- `catalog_coverage_readiness_config_missing`: deployed catalog coverage readiness could not be probed because `GROCERYVIEW_SERVER_URL` or `METRICS_TOKEN` was missing; inspect `groceryview-deployed-readiness` for the non-secret missing-key list.
- `catalog_coverage_readiness_diagnostic_missing`: deployed catalog coverage readiness curl failed before writing JSON; inspect `groceryview-deployed-readiness` for the curl exit code.
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
- the latest `daily-ingestion.yml` run passes and includes the always-attempted `groceryview-production-config-preflight`, `groceryview-daily-connector-stores`, `groceryview-production-ingestion-config`, `groceryview-daily-db-connectivity`, `groceryview-production-db-migrations`, `groceryview-daily-ingestion-result`, `groceryview-db-site-snapshot`, and `groceryview-deployed-readiness` artifacts, with `groceryview-production-config-preflight` preserving `production_config_preflight_diagnostic_missing` diagnostics when preflight fails before writing normal JSON, `groceryview-daily-connector-stores` preserving `store_enumeration_diagnostic_missing` diagnostics when live store enumeration fails before writing normal JSON, `groceryview-production-ingestion-config` preserving `daily_connectors_diagnostic_missing`, `catalog_targets_diagnostic_missing`, and `production_env_validation_diagnostic_missing` diagnostics when daily connector generation, catalog target generation, or production env validation fails before writing normal JSON, `groceryview-daily-ingestion-result` preserving `daily_ingestion_connectors_diagnostic_missing` diagnostics when connector regeneration fails before the runner starts and `daily_ingestion_result_diagnostic_missing` diagnostics when the runner fails before writing normal JSON, `groceryview-db-site-snapshot` preserving both `db_site_snapshot_result_diagnostic_missing` command-failure diagnostics and `db-site-snapshot-result.json` coverage diagnostics when export validation fails after files are written, and `groceryview-deployed-readiness` preserving `postgres_readiness_config_missing`, `postgres_readiness_diagnostic_missing`, `source_run_readiness_config_missing`, `source_run_readiness_diagnostic_missing`, `catalog_coverage_readiness_config_missing`, and `catalog_coverage_readiness_diagnostic_missing` diagnostics when deployed readiness probes cannot write normal JSON.
- `/api/readiness/postgres`, `/api/readiness/source-runs`, and `/api/readiness/catalog-coverage` all return healthy/complete responses with HTTP 200; source-run readiness has zero blockers, zero missing fresh chains, zero insufficient accepted-row blockers, at least six succeeded evidence entries, and a latest successful finish timestamp; and catalog coverage has no missing dimension, product-store-pair, or store-price-type gaps.
