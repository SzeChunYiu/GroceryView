from groceryview_data_pipeline.assets import (
    build_latest_price_rollup,
    build_normalized_products,
    build_observation_freshness_summary,
    build_price_observations,
    build_quality_checks,
    build_retailer_fetch_stubs,
    build_seed_products,
    build_seed_stores,
)
from groceryview_data_pipeline.models import LatestPriceRow, PriceObservationRow, PriceProvenance


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

    for row in observations:
        assert row.provenance.raw_snapshot_ref is not None
        assert row.provenance.raw_record_id

    for row in latest:
        assert row.provenance.raw_record_id.startswith("raw-")

    round_tripped = PriceProvenance(**first_stub.provenance.to_dict())
    assert round_tripped.parser_version == first_stub.provenance.parser_version


def test_latest_price_rollup_picks_latest_observation() -> None:
    product_slug = build_seed_products()[0].slug
    store_slug = build_seed_stores()[0].slug

    older_observation = PriceObservationRow(
        product_slug=product_slug,
        store_slug=store_slug,
        price_amount=10.0,
        unit="package",
        unit_price_amount=10.0,
        unit_price_unit="package",
        price_type="regular",
        observed_at="2026-05-19T11:00:00+00:00",
        source_type="retailer_page",
        confidence=0.7,
        confidence_label="medium",
        provenance=PriceProvenance(
            source_type="retailer_page",
            source_name="Demo source",
            source_url="https://example.com",
            source_run_id="run-1",
            raw_record_id="raw-1",
            raw_snapshot_ref="s3://groceryview-raw/run-1.json",
            fetched_at="2026-05-19T11:00:00+00:00",
            observed_at="2026-05-19T11:00:00+00:00",
            parser_version="demo-v1",
        ),
        member_only=False,
        promotion_label=None,
        valid_from=None,
        valid_to=None,
        demo=True,
    )
    newer_observation = PriceObservationRow(
        product_slug=product_slug,
        store_slug=store_slug,
        price_amount=9.0,
        unit="package",
        unit_price_amount=9.0,
        unit_price_unit="package",
        price_type="promotion",
        observed_at="2026-05-19T12:00:00+00:00",
        source_type="retailer_page",
        confidence=0.95,
        confidence_label="high",
        provenance=PriceProvenance(
            source_type="retailer_page",
            source_name="Demo source",
            source_url="https://example.com",
            source_run_id="run-2",
            raw_record_id="raw-2",
            raw_snapshot_ref="s3://groceryview-raw/run-2.json",
            fetched_at="2026-05-19T12:00:00+00:00",
            observed_at="2026-05-19T12:00:00+00:00",
            parser_version="demo-v1",
        ),
        member_only=False,
        promotion_label=None,
        valid_from=None,
        valid_to=None,
        demo=True,
    )

    rolled = build_latest_price_rollup([older_observation, newer_observation])
    assert len(rolled) == 1
    rolled_row = rolled[0]
    assert isinstance(rolled_row, LatestPriceRow)
    assert rolled_row.price_amount == 9.0
    assert rolled_row.price_type == "promotion"


def test_observation_freshness_summary_blocks_stale_future_and_missing_observations() -> None:
    product_slug = build_seed_products()[0].slug
    store_slug = build_seed_stores()[0].slug
    provenance = PriceProvenance(
        source_type="retailer_page",
        source_name="Demo source",
        source_url="https://example.com",
        source_run_id="run-freshness",
        raw_record_id="raw-freshness",
        raw_snapshot_ref="s3://groceryview-raw/run-freshness.json",
        fetched_at="2026-05-20T12:00:00+00:00",
        observed_at="2026-05-20T12:00:00+00:00",
        parser_version="demo-v1",
    )

    def row(observed_at: str) -> PriceObservationRow:
        return PriceObservationRow(
            product_slug=product_slug,
            store_slug=store_slug,
            price_amount=10.0,
            unit="package",
            unit_price_amount=10.0,
            unit_price_unit="package",
            price_type="regular",
            observed_at=observed_at,
            source_type="retailer_page",
            confidence=0.9,
            confidence_label="high",
            provenance=provenance,
            member_only=False,
            promotion_label=None,
            valid_from=None,
            valid_to=None,
            demo=True,
        )

    summary = build_observation_freshness_summary(
        [
            row("2026-05-20T11:00:00+00:00"),
            row("2026-05-18T11:59:59+00:00"),
            row("2026-05-20T13:00:00+00:00"),
            row("not-a-date"),
        ],
        checked_at="2026-05-20T12:00:00+00:00",
        max_age_hours=48,
    )

    assert summary.to_dict() == {
        "status": "blocked",
        "observation_count": 4,
        "fresh_count": 1,
        "stale_count": 1,
        "future_count": 1,
        "missing_observed_at_count": 1,
        "max_age_hours": 48,
        "checked_at": "2026-05-20T12:00:00+00:00",
        "demo": True,
    }
