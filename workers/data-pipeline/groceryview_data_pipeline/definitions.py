from __future__ import annotations

from . import assets as pipeline_assets


try:
    from dagster import Definitions, asset
except ModuleNotFoundError:  # Keep unit tests runnable without installing Dagster.
    Definitions = None  # type: ignore[assignment]
    asset = None  # type: ignore[assignment]


if asset is not None:

    @asset
    def stores():
        return pipeline_assets.seed_stores()

    @asset
    def products():
        return pipeline_assets.seed_products()

    @asset
    def raw_retailer_records():
        return pipeline_assets.retailer_fetch_stubs()

    @asset
    def price_observations(raw_retailer_records):
        return pipeline_assets.normalize_retailer_records(raw_retailer_records)

    @asset
    def latest_prices(price_observations):
        return pipeline_assets.build_latest_price_rollup(price_observations)

    @asset
    def quality_checks(stores, products, raw_retailer_records, price_observations, latest_prices):
        return pipeline_assets.collect_quality_checks(stores, products, raw_retailer_records, price_observations, latest_prices)

    defs = Definitions(assets=[stores, products, raw_retailer_records, price_observations, latest_prices, quality_checks])
else:
    defs = None
