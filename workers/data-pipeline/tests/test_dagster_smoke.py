import pytest

from scripts.smoke_dagster_definitions import EXPECTED_ASSETS, main


def test_dagster_smoke_lists_all_expected_assets() -> None:
    pytest.importorskip("dagster")
    assert main() == 0


def test_dagster_smoke_expected_asset_contract() -> None:
    assert EXPECTED_ASSETS == {
        "latest_price_rollup",
        "normalized_products",
        "price_observation_freshness",
        "price_observations",
        "quality_checks",
        "retailer_fetch_stubs",
        "seed_products",
        "seed_stores",
    }
