from dagster import Definitions

from .assets import (
    latest_price_rollup,
    normalized_products,
    open_prices_real_pull_plan,
    price_observation_coverage,
    price_observation_freshness,
    price_observation_mix,
    price_observations,
    quality_checks,
    retailer_fetch_stubs,
    seed_products,
    seed_stores,
)

defs = Definitions(
    assets=[
        seed_stores,
        seed_products,
        retailer_fetch_stubs,
        normalized_products,
        price_observations,
        latest_price_rollup,
        quality_checks,
        price_observation_freshness,
        open_prices_real_pull_plan,
        price_observation_coverage,
        price_observation_mix,
    ]
)
