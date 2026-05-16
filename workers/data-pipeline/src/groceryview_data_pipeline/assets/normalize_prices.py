"""Normalization assets for demo rows until production ingestion approval."""

from dagster import asset

from groceryview_data_pipeline.schemas.observations import (
    NormalizedProduct,
    PriceObservation,
    PromotionObservation,
    RetailerFetchResult,
)


@asset(group_name="normalize")
def normalized_products(
    fetch_willys_category_snapshot: RetailerFetchResult,
    fetch_hemkop_category_snapshot: RetailerFetchResult,
    fetch_open_food_facts_catalog: RetailerFetchResult,
) -> list[NormalizedProduct]:
    """Merge retailer/OFF products into normalized demo products."""

    return [
        *fetch_willys_category_snapshot.products,
        *fetch_hemkop_category_snapshot.products,
        *fetch_open_food_facts_catalog.products,
    ]


@asset(group_name="normalize")
def price_observations(
    fetch_willys_category_snapshot: RetailerFetchResult,
    fetch_hemkop_category_snapshot: RetailerFetchResult,
    fetch_open_food_facts_catalog: RetailerFetchResult,
) -> list[PriceObservation]:
    """Emit demo price observations with source provenance and confidence labels."""

    return [
        *fetch_willys_category_snapshot.prices,
        *fetch_hemkop_category_snapshot.prices,
        *fetch_open_food_facts_catalog.prices,
    ]


@asset(group_name="normalize")
def promotion_observations(
    fetch_willys_category_snapshot: RetailerFetchResult,
    fetch_hemkop_category_snapshot: RetailerFetchResult,
    fetch_lidl_offer_seed: list[PromotionObservation],
) -> list[PromotionObservation]:
    """Emit demo promotion rows; member/promo prices stay distinct from regular prices."""

    return [
        *fetch_willys_category_snapshot.promotions,
        *fetch_hemkop_category_snapshot.promotions,
        *fetch_lidl_offer_seed,
    ]
