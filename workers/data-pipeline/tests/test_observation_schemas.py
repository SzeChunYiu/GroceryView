from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from groceryview_data_pipeline.schemas.observations import (
    PriceObservation,
    PromotionObservation,
)

BASE_PROVENANCE = {
    "source_type": "willys_online_json",
    "source_url": "https://www.willys.se/c/demo?size=50&page=0",
    "observed_at": datetime.now(tz=UTC),
    "currency": "SEK",
    "confidence_score": 0.80,
    "raw_snapshot_hash": "a" * 64,
    "parser_version": "test-v1",
}


def test_price_observation_requires_provenance_fields() -> None:
    row = PriceObservation(
        **BASE_PROVENANCE,
        price_type="online",
        product_key="willys:demo",
        price=12.30,
        is_online_price=True,
    )
    assert row.source_type == "willys_online_json"
    assert row.currency == "SEK"
    assert row.raw_snapshot_hash
    assert row.parser_version == "test-v1"


@pytest.mark.parametrize("confidence", [-0.1, 1.1])
def test_confidence_score_is_bounded(confidence: float) -> None:
    with pytest.raises(ValidationError):
        PriceObservation(
            **{**BASE_PROVENANCE, "confidence_score": confidence},
            price_type="online",
            product_key="willys:demo",
            price=12.30,
        )


def test_observed_at_must_be_timezone_aware() -> None:
    with pytest.raises(ValidationError):
        PriceObservation(
            **{**BASE_PROVENANCE, "observed_at": datetime(2026, 5, 16, 4, 30)},
            price_type="online",
            product_key="willys:demo",
            price=12.30,
        )


def test_promotion_preserves_distinct_price_type_and_store_id() -> None:
    row = PromotionObservation(
        **BASE_PROVENANCE,
        price_type="promo",
        product_key="willys:demo",
        promotion_id="promo-1",
        store_id="stockholm-demo",
        campaign_text="Demo promotion",
    )
    assert row.price_type == "promo"
    assert row.store_id == "stockholm-demo"
