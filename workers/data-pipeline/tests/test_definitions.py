from dagster import Definitions

from groceryview_data_pipeline.checks.quality_checks import QUALITY_CHECKS
from groceryview_data_pipeline.definitions import ALL_ASSETS, defs
from groceryview_data_pipeline.jobs import ALL_JOBS
from groceryview_data_pipeline.schedules import ALL_SCHEDULES


def test_definitions_loads_assets_checks_jobs_and_schedules() -> None:
    assert isinstance(defs, Definitions)
    repo = defs.get_repository_def()
    asset_keys = {key.to_user_string() for key in defs.resolve_all_asset_keys()}
    expected_assets = {
        "source_runs_seed",
        "stockholm_chain_seed",
        "stockholm_store_seed",
        "hero_product_seed",
        "fetch_willys_category_snapshot",
        "fetch_hemkop_category_snapshot",
        "fetch_ica_store_seed",
        "fetch_lidl_offer_seed",
        "fetch_open_food_facts_catalog",
        "normalized_products",
        "price_observations",
        "promotion_observations",
        "latest_store_prices_rollup",
        "price_series_daily_rollup",
        "stockholm_grocery_index_seed",
        "deal_score_input_seed",
    }
    assert expected_assets.issubset(asset_keys)
    assert len(ALL_ASSETS) == len(expected_assets)

    job_names = {job.name for job in ALL_JOBS}
    assert {
        "seed_catalog_job",
        "retailer_fetch_job",
        "normalize_prices_job",
        "rollup_prices_job",
    }.issubset(job_names)
    assert repo.has_job("retailer_fetch_job")

    assert {schedule.name for schedule in ALL_SCHEDULES} == {"retailer_fetch_daily_schedule"}
    assert ALL_SCHEDULES[0].cron_schedule == "30 4 * * *"

    assert {spec.name for check in QUALITY_CHECKS for spec in check.check_specs} == {
        "price_is_positive",
        "currency_is_sek",
        "unit_price_present_when_unit_size_present",
        "confidence_between_zero_and_one",
        "member_and_promo_are_distinct",
        "price_rows_have_required_provenance",
        "promotion_rows_have_required_provenance",
    }
