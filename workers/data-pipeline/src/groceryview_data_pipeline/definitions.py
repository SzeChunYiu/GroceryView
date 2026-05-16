"""Dagster Definitions entry point for the GroceryView data pipeline."""

from dagster import Definitions, resource

from groceryview_data_pipeline.assets.normalize_prices import (
    normalized_products,
    price_observations,
    promotion_observations,
)
from groceryview_data_pipeline.assets.retailer_fetch import (
    fetch_hemkop_category_snapshot,
    fetch_ica_store_seed,
    fetch_lidl_offer_seed,
    fetch_open_food_facts_catalog,
    fetch_willys_category_snapshot,
)
from groceryview_data_pipeline.assets.rollups import (
    deal_score_input_seed,
    latest_store_prices_rollup,
    price_series_daily_rollup,
    stockholm_grocery_index_seed,
)
from groceryview_data_pipeline.assets.seed_catalog import (
    hero_product_seed,
    stockholm_chain_seed,
    stockholm_store_seed,
)
from groceryview_data_pipeline.assets.source_runs import source_runs_seed
from groceryview_data_pipeline.checks.quality_checks import QUALITY_CHECKS
from groceryview_data_pipeline.jobs import ALL_JOBS
from groceryview_data_pipeline.resources.database import build_database_resource
from groceryview_data_pipeline.resources.object_storage import build_object_storage_resource
from groceryview_data_pipeline.resources.settings import get_settings
from groceryview_data_pipeline.schedules import ALL_SCHEDULES

ALL_ASSETS = [
    source_runs_seed,
    stockholm_chain_seed,
    stockholm_store_seed,
    hero_product_seed,
    fetch_willys_category_snapshot,
    fetch_hemkop_category_snapshot,
    fetch_ica_store_seed,
    fetch_lidl_offer_seed,
    fetch_open_food_facts_catalog,
    normalized_products,
    price_observations,
    promotion_observations,
    latest_store_prices_rollup,
    price_series_daily_rollup,
    stockholm_grocery_index_seed,
    deal_score_input_seed,
]


@resource
def settings_resource() -> object:
    return get_settings()


@resource
def database_resource() -> object:
    return build_database_resource()


@resource
def object_storage_resource() -> object:
    return build_object_storage_resource()


defs = Definitions(
    assets=ALL_ASSETS,
    asset_checks=QUALITY_CHECKS,
    jobs=ALL_JOBS,
    schedules=ALL_SCHEDULES,
    resources={
        "settings": settings_resource,
        "database": database_resource,
        "object_storage": object_storage_resource,
    },
)
