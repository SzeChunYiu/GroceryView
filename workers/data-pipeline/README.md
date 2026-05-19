# GroceryView data pipeline

Dagster scaffold for the GroceryView data-worker lane.

## What ships here

- Stockholm store and product seed assets.
- Stubbed retailer fetch assets with explicit provenance.
- Normalization, price-observation, latest-price rollup, and quality-check assets.
- A `dagster dev` entrypoint that boots the local webserver.

## Run locally

```bash
cd workers/data-pipeline
python3 -m venv .venv
. .venv/bin/activate
pip install -e .[dev]
dagster dev -m groceryview_data_pipeline.definitions
```

## Tests

```bash
pytest
```
