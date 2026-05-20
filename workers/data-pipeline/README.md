# GroceryView data pipeline

Dagster scaffold for the GroceryView data-worker lane.

## What ships here

- Stockholm store and product seed assets.
- Stubbed retailer fetch assets with explicit provenance.
- Normalization, price-observation, latest-price rollup, and quality-check assets.
- A `dagster dev` entrypoint that boots the local webserver.
- Deterministic seed/order behavior so local materializations are reproducible.

## Run locally

```bash
cd workers/data-pipeline
python3 -m venv .venv
. .venv/bin/activate
scripts/verify_dagster_definitions.sh
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

## Tests

```bash
pytest
```

`scripts/verify_dagster_definitions.sh` is the CI-safe definitions load test.
It installs the worker package, imports `groceryview_data_pipeline.definitions`,
lists the seven expected assets, and exits nonzero if Dagster cannot load the
module.
