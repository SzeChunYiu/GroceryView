# GroceryView data pipeline

Dagster scaffold for the GroceryView data-worker lane.

## What ships here

- Stockholm store and product seed assets.
- Stubbed retailer fetch assets with explicit provenance.
- Normalization, price-observation, latest-price rollup, and quality-check assets.
- Observation coverage summaries for seeded stores and products.
- Price observation freshness summaries for stale or future-dated worker outputs.
- Price observation mix summaries for source, confidence, member, and promotion breakdowns.
- A data pipeline quality gate that combines provenance, freshness, rollup, and coverage checks.
- The quality gate also checks `open_prices_ingestion_run_plan`, so scheduled Open Prices ingestion remains blocked until database, raw snapshot storage, User-Agent, and schedule gates are configured.
- The quality gate also checks `open_prices_artifact_import_plan`, so the Open Prices handoff cannot pass until the PostgreSQL import command has its database URL, input artifact, and built DB package.
- The quality gate also checks `open_prices_hosted_smoke_plan`, so launch readiness remains blocked until hosted API, imported product-terminal, and PostgreSQL readiness smoke prerequisites are configured.
- The quality gate also checks `open_prices_schedule_health_plan`, so hosted scheduled-worker proof remains blocked until both Open Prices schedules and their health probe are configured.
- Open Prices real-data pull plan asset with required User-Agent, endpoint, parser, smoke command, and evidence fields.
- Open Prices artifact import plan asset with the PostgreSQL import command, required env, database targets, and persisted evidence fields.
- Open Prices ingestion run plan asset with schedule, persistence targets, idempotency keys, and fail-closed deployment requirements.
- Open Prices hosted smoke plan asset with the hosted API, imported product-terminal, and PostgreSQL readiness smoke commands.
- Open Prices launch readiness summary that rolls the pull, scheduled ingestion, artifact import, hosted smoke, and schedule health plans into one blocker list for operators.
- Open Prices launch readiness digest with dashboard-friendly counts for checked plans, remaining actions, evidence fields, hosted-smoke blockers, and persistence blockers.
- Open Prices schedule health plan asset with the Dagster deployment URL, schedule enablement flags, and last-run evidence needed before hosted scheduled-worker proof can pass.
- An `open_prices_ingestion_schedule` Dagster schedule contract that targets the Open Prices pull, ingestion plan, observations, latest-price rollup, freshness, and coverage assets every six hours.
- An `open_prices_import_readiness_schedule` Dagster schedule contract that targets the Open Prices import plan, launch readiness summary, and data-pipeline quality gate every six hours after the ingestion plan window.
- A `dagster dev` entrypoint that boots the local webserver.
- Deterministic seed/order behavior so local materializations are reproducible.

## Run locally

```bash
cd workers/data-pipeline
python3 -m venv .venv
. .venv/bin/activate
pip install -e .[dev]
dagster dev -m groceryview_data_pipeline.definitions
```

Example Dagster assets in this lane:
- `seed_stores`
- `seed_products`
- `retailer_fetch_stubs`
- `normalized_products`
- `price_observations`
- `latest_price_rollup`
- `quality_checks`
- `data_pipeline_quality_gate`
- `price_observation_coverage`
- `price_observation_freshness`
- `price_observation_mix`
- `open_prices_real_pull_plan`
- `open_prices_artifact_import_plan`
- `open_prices_hosted_smoke_plan`
- `open_prices_ingestion_run_plan`
- `open_prices_launch_readiness`
- `open_prices_launch_readiness_digest`
- `open_prices_schedule_health_plan`

Example Dagster schedules in this lane:
- `open_prices_ingestion_schedule`
- `open_prices_import_readiness_schedule`

## Open Prices ingestion run plan

`open_prices_ingestion_run_plan` is blocked by default. It turns the public Open Prices smoke into a production ingestion checklist without pretending live infrastructure is configured. The plan requires:

- `OPEN_PRICES_USER_AGENT`
- `DATABASE_URL`
- `GROCERYVIEW_RAW_SNAPSHOT_BUCKET`
- `OPEN_PRICES_SCHEDULE_ENABLED`

When those gates are ready, the planned run materializes the Open Prices pull, persists raw snapshots/source-run evidence, writes normalized price observations, refreshes latest-price rollups, and emits freshness/coverage evidence. The idempotency key uses source type, source URL, content hash, parser version, and observed timestamp so reruns do not duplicate accepted price rows.

`open_prices_ingestion_schedule` is defined with cron `17 */6 * * *` in UTC and targets the same assets listed in the run plan. The schedule contract is included in the Dagster smoke verifier so accidental removal blocks release validation once Dagster is installed in the worker environment.

`open_prices_launch_readiness` combines the pull plan, scheduled ingestion plan, artifact import plan, hosted smoke plan, and schedule health plan into one readiness summary. It reports ready/blocked plan counts, blockers grouped by plan, deduplicated next actions, and the full evidence-field set needed before Open Prices data can safely power product prices. `open_prices_launch_readiness_digest` emits compact counts from the same summary for dashboards and alert routing.

`open_prices_schedule_health_plan` blocks hosted scheduled-worker proof until the Dagster deployment URL, both Open Prices schedules, and a health probe for last tick/run age are configured. Its summary counts required actions, environment variables, source assets, schedules, and evidence fields for operator dashboards.

## Open Prices artifact import plan

`open_prices_artifact_import_plan` exposes the PostgreSQL handoff for a saved Open Prices artifact. It remains blocked until `DATABASE_URL`, `OPEN_PRICES_INPUT_PATH`, and a built `@groceryview/db` package are available. The command plan uses `infra/scripts/import-open-prices-artifact.sh` and expects persisted evidence for source run, accepted rows, raw records, observations, products, and chains.

`open_prices_hosted_smoke_plan` exposes the hosted proof gate for imported Open Prices data. It remains blocked until `GROCERYVIEW_SERVER_URL`, `GROCERYVIEW_TERMINAL_PRODUCT_ID`, and `METRICS_TOKEN` are configured, then points operators at `infra/scripts/smoke-hosted-http.sh` and `infra/scripts/smoke-hosted-readiness.sh` to prove API health, product-terminal output for an imported product, and PostgreSQL readiness.

`open_prices_import_readiness_schedule` is defined with cron `47 */6 * * *` in UTC. It targets the import plan, ingestion plan, launch readiness summary, quality checks, freshness, coverage, and `data_pipeline_quality_gate` so scheduled worker validation keeps the PostgreSQL handoff blocked until the import prerequisites are satisfied.

## Tests

```bash
pytest
```
