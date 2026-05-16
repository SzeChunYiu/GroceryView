"""Data quality checks for normalized price and promotion rows."""

from dagster import AssetCheckResult, AssetKey, asset_check

from groceryview_data_pipeline.schemas.observations import PriceObservation, PromotionObservation


@asset_check(asset=AssetKey("price_observations"), name="price_is_positive")
def price_is_positive(price_observations: list[PriceObservation]) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(row.price > 0 for row in price_observations),
        metadata={"rows": len(price_observations)},
    )


@asset_check(asset=AssetKey("price_observations"), name="currency_is_sek")
def currency_is_sek(price_observations: list[PriceObservation]) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(row.currency == "SEK" for row in price_observations),
        metadata={"rows": len(price_observations)},
    )


@asset_check(asset=AssetKey("price_observations"), name="unit_price_present_when_unit_size_present")
def unit_price_present_when_unit_size_present(
    price_observations: list[PriceObservation],
) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(
            row.compare_price_unit is not None or row.unit_size is None
            for row in price_observations
        ),
        metadata={"rows": len(price_observations)},
    )


@asset_check(asset=AssetKey("price_observations"), name="confidence_between_zero_and_one")
def confidence_between_zero_and_one(
    price_observations: list[PriceObservation],
) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(0.0 <= row.confidence_score <= 1.0 for row in price_observations),
        metadata={"rows": len(price_observations)},
    )


@asset_check(asset=AssetKey("promotion_observations"), name="member_and_promo_are_distinct")
def member_and_promo_are_distinct(
    promotion_observations: list[PromotionObservation],
) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(
            row.price_type in {"promo", "member", "flyer_or_promo"}
            for row in promotion_observations
        ),
        metadata={"rows": len(promotion_observations)},
    )


@asset_check(asset=AssetKey("price_observations"), name="price_rows_have_required_provenance")
def price_rows_have_required_provenance(
    price_observations: list[PriceObservation],
) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(
            row.source_url
            and row.observed_at
            and row.parser_version
            and row.raw_snapshot_hash
            and row.source_type
            for row in price_observations
        ),
        metadata={"rows": len(price_observations)},
    )


@asset_check(
    asset=AssetKey("promotion_observations"), name="promotion_rows_have_required_provenance"
)
def promotion_rows_have_required_provenance(
    promotion_observations: list[PromotionObservation],
) -> AssetCheckResult:
    return AssetCheckResult(
        passed=all(
            row.source_url
            and row.observed_at
            and row.parser_version
            and row.raw_snapshot_hash
            and row.source_type
            for row in promotion_observations
        ),
        metadata={"rows": len(promotion_observations)},
    )


QUALITY_CHECKS = [
    price_is_positive,
    currency_is_sek,
    unit_price_present_when_unit_size_present,
    confidence_between_zero_and_one,
    member_and_promo_are_distinct,
    price_rows_have_required_provenance,
    promotion_rows_have_required_provenance,
]
