# GroceryView data pipeline

Dagster scaffold for the GroceryView data-worker lane.

## What ships here

- Stockholm store and product seed assets.
- Stubbed retailer fetch assets with explicit provenance.
- Normalization, price-observation, latest-price rollup, and quality-check assets.
- Price observation freshness summaries for stale or future-dated worker outputs.
- Open Prices real-data pull plan asset with required User-Agent, endpoint, parser, smoke command, and evidence fields.
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
- `price_observation_freshness`
- `open_prices_real_pull_plan`

## Tests

```bash
pytest
```
