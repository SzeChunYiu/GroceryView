from groceryview_data_pipeline.assets import (
    build_latest_price_rollup,
    build_normalized_products,
    build_price_observations,
    build_quality_checks,
    build_retailer_fetch_stubs,
    build_seed_products,
    build_seed_stores,
)
from groceryview_data_pipeline.models import PriceProvenance


def test_data_pipeline_assets_cover_the_expected_lane_contract() -> None:
    stores = build_seed_stores()
    products = build_seed_products()
    stubs = build_retailer_fetch_stubs(stores, products)
    normalized_products = build_normalized_products(products)
    observations = build_price_observations(stubs, normalized_products)
    latest = build_latest_price_rollup(observations)
    quality = build_quality_checks(stubs, observations, latest)

    assert len(stores) >= 5
    assert len(products) >= 8
    assert len(stubs) > 0
    assert len(observations) == len(stubs)
    assert len(latest) <= len(observations)
    assert quality.observation_count == len(observations)
    assert quality.latest_rollup_count == len(latest)
    assert quality.missing_provenance_count == 0
    assert quality.fetch_stub_count == len(stubs)
    assert "retailer_page" in quality.source_types

    first_stub = stubs[0]
    assert first_stub.provenance.source_type == "retailer_page"
    assert first_stub.provenance.source_run_id.startswith("demo-run-")
    assert first_stub.provenance.raw_snapshot_ref and first_stub.provenance.raw_snapshot_ref.startswith("s3://")

    first_observation = observations[0]
    assert first_observation.provenance.observed_at == first_observation.observed_at
    assert first_observation.unit_price_amount is not None
    assert first_observation.price_type in {"regular", "promotion"}

    round_tripped = PriceProvenance(**first_stub.provenance.to_dict())
    assert round_tripped.parser_version == first_stub.provenance.parser_version
