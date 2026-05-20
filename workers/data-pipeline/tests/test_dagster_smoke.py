import pytest

from scripts.smoke_dagster_definitions import EXPECTED_ASSETS, EXPECTED_SCHEDULES, main


def test_dagster_smoke_lists_all_expected_assets() -> None:
    pytest.importorskip("dagster")
    assert main() == 0


def test_dagster_smoke_expected_asset_contract() -> None:
    assert EXPECTED_ASSETS == {
        "data_pipeline_quality_gate",
        "latest_price_rollup",
        "normalized_products",
        "open_prices_artifact_import_plan",
        "open_prices_hosted_smoke_plan",
        "open_prices_ingestion_run_plan",
        "open_prices_launch_readiness",
        "open_prices_launch_readiness_digest",
        "open_prices_real_pull_plan",
        "price_observation_coverage",
        "price_observation_freshness",
        "price_observation_mix",
        "price_observations",
        "quality_checks",
        "retailer_fetch_stubs",
        "seed_products",
        "seed_stores",
    }


def test_dagster_smoke_expected_schedule_contract() -> None:
    assert EXPECTED_SCHEDULES == {
        "open_prices_import_readiness_schedule",
        "open_prices_ingestion_schedule",
    }
