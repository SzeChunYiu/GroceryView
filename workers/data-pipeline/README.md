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
- Open Prices real-data pull plan asset with required User-Agent, endpoint, parser, smoke command, and evidence fields.
- Open Prices ingestion run plan asset with schedule, persistence targets, idempotency keys, and fail-closed deployment requirements.
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
- `open_prices_ingestion_run_plan`

## Open Prices ingestion run plan

`open_prices_ingestion_run_plan` is blocked by default. It turns the public Open Prices smoke into a production ingestion checklist without pretending live infrastructure is configured. The plan requires:

- `OPEN_PRICES_USER_AGENT`
- `DATABASE_URL`
- `GROCERYVIEW_RAW_SNAPSHOT_BUCKET`
- `OPEN_PRICES_SCHEDULE_ENABLED`

When those gates are ready, the planned run materializes the Open Prices pull, persists raw snapshots/source-run evidence, writes normalized price observations, refreshes latest-price rollups, and emits freshness/coverage evidence. The idempotency key uses source type, source URL, content hash, parser version, and observed timestamp so reruns do not duplicate accepted price rows.

## Tests

```bash
pytest
```
