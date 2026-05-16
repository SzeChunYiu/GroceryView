"""Willys structured JSON scraper stub."""

from datetime import datetime, time
from typing import Any

from groceryview_data_pipeline.schemas.observations import (
    NormalizedProduct,
    PriceObservation,
    PromotionObservation,
    RetailerFetchResult,
)
from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance, snapshot_hash

PARSER_VERSION = "willys-v0-stub"
ENDPOINT_TEMPLATE = "https://www.willys.se/c/{category}?size=50&page={page}"


class WillysScraper:
    source_name = "willys"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://www.willys.se/robots.txt",
        crawl_delay_seconds=10,
        visit_start_utc=time(4, 0),
        visit_end_utc=time(8, 45),
        requires_partner_approval=True,
        notes=(
            "robots.txt requests Crawl-delay: 10 and Visit-time 04:00-08:45 UTC",
            "online JSON prices are not official partner prices until Axfood approves use",
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=10)

    async def fetch(self, category: str, page: int = 0) -> RetailerFetchResult:
        raise NotImplementedError("Willys network fetching is disabled until legal/data approval.")


def parse_willys_products(
    payload: dict[str, Any], *, category: str, source_url: str, observed_at: datetime
) -> RetailerFetchResult:
    """Parse Axfood-shaped product JSON into GroceryView observations."""

    raw_hash = snapshot_hash(payload)
    products: list[NormalizedProduct] = []
    prices: list[PriceObservation] = []
    promotions: list[PromotionObservation] = []

    for item in payload.get("results", payload.get("products", [])):
        code = str(item.get("code") or item.get("id") or "")
        if not code:
            continue
        name = str(item.get("name") or item.get("title") or code)
        image_urls = [
            asset.get("url") for asset in item.get("images", []) if isinstance(asset, dict)
        ]
        image_urls += [
            asset.get("url") for asset in item.get("assets", []) if isinstance(asset, dict)
        ]
        labels = [str(label) for label in item.get("labels", [])]
        product_key = f"willys:{code}"

        products.append(
            NormalizedProduct(
                source_type="willys_online_json",
                source_url=source_url,
                observed_at=observed_at,
                price_type="online",
                confidence_score=0.80,
                raw_snapshot_hash=raw_hash,
                parser_version=PARSER_VERSION,
                retailer_product_id=code,
                name=name,
                manufacturer=item.get("manufacturer"),
                category_path=[category],
                image_urls=[url for url in image_urls if url],
                labels=labels,
            )
        )
        price_value = item.get("priceValue") or item.get("price")
        if price_value is not None:
            prices.append(
                PriceObservation(
                    source_type="willys_online_json",
                    source_url=source_url,
                    observed_at=observed_at,
                    price_type="online",
                    confidence_score=0.80,
                    raw_snapshot_hash=raw_hash,
                    parser_version=PARSER_VERSION,
                    product_key=product_key,
                    retailer_product_id=code,
                    price=float(price_value),
                    compare_price=(
                        float(item["comparePrice"])
                        if item.get("comparePrice") is not None
                        else None
                    ),
                    compare_price_unit=item.get("comparePriceUnit"),
                    price_unit=item.get("priceUnit"),
                    is_online_price=True,
                )
            )
        for promo in item.get("potentialPromotions", []) or []:
            promotions.append(
                PromotionObservation(
                    source_type="willys_online_json",
                    source_url=source_url,
                    observed_at=observed_at,
                    price_type="promo",
                    confidence_score=0.80,
                    raw_snapshot_hash=raw_hash,
                    parser_version=PARSER_VERSION,
                    product_key=product_key,
                    promotion_id=str(promo.get("code") or promo.get("id") or ""),
                    campaign_text=promo.get("description")
                    or promo.get("text")
                    or promo.get("title"),
                    member_only=bool(promo.get("memberOnly", False)),
                )
            )

    return RetailerFetchResult(
        source_name="willys",
        fetched_at=observed_at,
        source_url=source_url,
        raw_snapshot_hash=raw_hash,
        products=products,
        prices=prices,
        promotions=promotions,
        metadata={"category": category, "parser_version": PARSER_VERSION},
    )
