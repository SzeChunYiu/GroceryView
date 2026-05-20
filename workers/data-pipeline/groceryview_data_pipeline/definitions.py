from dagster import AssetSelection, Definitions, ScheduleDefinition, define_asset_job

from .assets import (
    data_pipeline_quality_gate,
    latest_price_rollup,
    open_prices_artifact_import_plan,
    open_prices_ingestion_run_plan,
    open_prices_launch_readiness,
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

open_prices_ingestion_job = define_asset_job(
    "open_prices_ingestion_job",
    selection=AssetSelection.keys(
        "open_prices_real_pull_plan",
        "open_prices_ingestion_run_plan",
        "price_observations",
        "latest_price_rollup",
        "price_observation_freshness",
        "price_observation_coverage",
    ),
)

open_prices_ingestion_schedule = ScheduleDefinition(
    job=open_prices_ingestion_job,
    cron_schedule="17 */6 * * *",
    execution_timezone="UTC",
    name="open_prices_ingestion_schedule",
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
        open_prices_artifact_import_plan,
        open_prices_ingestion_run_plan,
        open_prices_launch_readiness,
        price_observation_coverage,
        price_observation_mix,
        data_pipeline_quality_gate,
    ],
    jobs=[open_prices_ingestion_job],
    schedules=[open_prices_ingestion_schedule],
)
