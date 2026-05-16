"""Retailer fetch assets with approval-safe demo rows only."""

from datetime import UTC, datetime

from dagster import asset

from groceryview_data_pipeline.schemas.observations import (
    NormalizedProduct,
    PriceObservation,
    PromotionObservation,
    RetailerFetchResult,
)
from groceryview_data_pipeline.scrapers.base import snapshot_hash
from groceryview_data_pipeline.scrapers.hemkop import parse_hemkop_products
from groceryview_data_pipeline.scrapers.willys import parse_willys_products


def _demo_axfood_payload(code: str, name: str, price: float) -> dict[str, object]:
    return {
        "results": [
            {
                "code": code,
                "name": name,
                "manufacturer": "Demo",
                "price": price,
                "priceValue": price,
                "comparePrice": round(price, 2),
                "comparePriceUnit": "kr/l",
                "priceUnit": "st",
                "labels": ["demo"],
                "potentialPromotions": [],
                "images": [],
            }
        ]
    }


@asset(group_name="retailer_fetch")
def fetch_willys_category_snapshot() -> RetailerFetchResult:
    """Demo Willys category snapshot; real fetch is blocked until approval."""

    return parse_willys_products(
        _demo_axfood_payload("demo-milk-1l", "Demo Milk 1L", 14.90),
        category="mejeri-ost-och-agg/mjolk",
        source_url="https://www.willys.se/c/mejeri-ost-och-agg/mjolk?size=50&page=0",
        observed_at=datetime.now(tz=UTC),
    )


@asset(group_name="retailer_fetch")
def fetch_hemkop_category_snapshot() -> RetailerFetchResult:
    """Demo Hemköp category snapshot; real fetch is blocked until approval."""

    return parse_hemkop_products(
        _demo_axfood_payload("demo-milk-1l", "Demo Milk 1L", 15.90),
        category="mejeri-ost-och-agg/mjolk",
        source_url="https://www.hemkop.se/c/mejeri-ost-och-agg/mjolk?size=50&page=0",
        observed_at=datetime.now(tz=UTC),
    )


@asset(group_name="retailer_fetch")
def fetch_ica_store_seed() -> list[dict[str, object]]:
    """Demo ICA Stockholm-area store seed; product context remains disabled."""

    return [
        {
            "source_type": "ica_per_store_json",
            "retailer_store_id": "demo-ica-stockholm",
            "name": "ICA Stockholm seed",
            "latitude": 59.33,
            "longitude": 18.06,
            "price_ingestion_status": "disabled_until_approval",
        }
    ]


@asset(group_name="retailer_fetch")
def fetch_lidl_offer_seed() -> list[PromotionObservation]:
    """Demo Lidl weekly offer row; full catalog is not assumed."""

    observed_at = datetime.now(tz=UTC)
    raw_hash = snapshot_hash("lidl-demo-offer")
    return [
        PromotionObservation(
            source_type="lidl_weekly_offer",
            source_url="https://www.lidl.se/",
            observed_at=observed_at,
            price_type="flyer_or_promo",
            currency="SEK",
            confidence_score=0.75,
            raw_snapshot_hash=raw_hash,
            parser_version="lidl-v0-stub",
            product_key="lidl:demo-offer",
            campaign_text="Demo weekly offer placeholder",
            member_only=False,
        )
    ]


@asset(group_name="retailer_fetch")
def fetch_open_food_facts_catalog() -> RetailerFetchResult:
    """Demo Open Food Facts metadata row; open prices remain supplemental."""

    observed_at = datetime.now(tz=UTC)
    raw_hash = snapshot_hash("off-demo-product")
    product = NormalizedProduct(
        source_type="open_food_facts_catalog",
        source_url="https://world.openfoodfacts.org/",
        observed_at=observed_at,
        price_type="estimated",
        currency="SEK",
        confidence_score=0.50,
        raw_snapshot_hash=raw_hash,
        parser_version="off-v0-stub",
        gtin="0000000000000",
        name="Demo Open Food Facts product",
        category_path=["metadata"],
    )
    price = PriceObservation(
        source_type="open_prices_community",
        source_url="https://prices.openfoodfacts.org/api/v1/",
        observed_at=observed_at,
        price_type="manual",
        currency="SEK",
        confidence_score=0.50,
        raw_snapshot_hash=raw_hash,
        parser_version="open-prices-v0-stub",
        product_key="open-prices:demo",
        price=1.0,
    )
    return RetailerFetchResult(
        source_name="open_food_facts",
        fetched_at=observed_at,
        source_url="https://world.openfoodfacts.org/",
        raw_snapshot_hash=raw_hash,
        products=[product],
        prices=[price],
        metadata={"coverage": "demo only"},
    )
