# GroceryView Data Pipeline

This worker package contains the first Dagster-compatible data-pipeline slice for GroceryView. It intentionally uses checked-in retailer stubs only; there is no live scraping or retailer HTTP traffic.

Pipeline assets:

- `stores` and `products`: seed Stockholm store and hero product records.
- `raw_retailer_records`: deterministic retailer fixture records with parser provenance.
- `price_observations`: normalized immutable price facts with `price_type`, `confidence`, `observed_at`, `source_type`, `source_url`, and provenance.
- `latest_prices`: rollup keyed by product, chain, store, and price type.
- `quality_checks`: checks seed references, parser provenance, and rollup coverage.

Run the pure unit tests without Dagster:

```sh
PYTHONPATH=. python -m unittest discover -s tests
```

With Dagster installed, list or serve assets from this module:

```sh
dagster asset list -m groceryview_data_pipeline.definitions
dagster dev -m groceryview_data_pipeline.definitions
```
