"""Dagster jobs for seed, fetch, normalize, and rollup phases."""

from dagster import Backoff, RetryPolicy, define_asset_job

_RETRY_POLICY = RetryPolicy(max_retries=3, delay=60, backoff=Backoff.EXPONENTIAL)

seed_catalog_job = define_asset_job(
    "seed_catalog_job",
    selection=["stockholm_chain_seed", "stockholm_store_seed", "hero_product_seed"],
    op_retry_policy=_RETRY_POLICY,
)

retailer_fetch_job = define_asset_job(
    "retailer_fetch_job",
    selection=[
        "source_runs_seed",
        "fetch_willys_category_snapshot",
        "fetch_hemkop_category_snapshot",
        "fetch_ica_store_seed",
        "fetch_lidl_offer_seed",
        "fetch_open_food_facts_catalog",
    ],
    op_retry_policy=_RETRY_POLICY,
)

normalize_prices_job = define_asset_job(
    "normalize_prices_job",
    selection=["normalized_products", "price_observations", "promotion_observations"],
    op_retry_policy=_RETRY_POLICY,
)

rollup_prices_job = define_asset_job(
    "rollup_prices_job",
    selection=[
        "latest_store_prices_rollup",
        "price_series_daily_rollup",
        "stockholm_grocery_index_seed",
        "deal_score_input_seed",
    ],
    op_retry_policy=_RETRY_POLICY,
)

ALL_JOBS = [seed_catalog_job, retailer_fetch_job, normalize_prices_job, rollup_prices_job]
