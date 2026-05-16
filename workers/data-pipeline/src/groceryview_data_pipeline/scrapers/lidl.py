"""Lidl Sweden weekly offer scraper placeholder."""

from dataclasses import dataclass
from datetime import datetime

from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance

SOURCE_URL = "https://www.lidl.se/"
PARSER_VERSION = "lidl-v0-stub"


@dataclass(frozen=True)
class LidlOfferCandidate:
    product_name: str
    offer_price: float | None
    compare_price: float | None
    valid_from: datetime | None
    valid_to: datetime | None
    campaign_text: str | None
    lidl_plus_only: bool = False


class LidlOfferScraper:
    source_name = "lidl"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://www.lidl.se/robots.txt",
        requires_partner_approval=True,
        notes=(
            "weekly/current offer data and leaflets only",
            "do not assume a full Swedish SKU catalog exists",
            (
                "output source_type=lidl_weekly_offer, price_type=flyer_or_promo, "
                "confidence_score=0.75"
            ),
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=10)

    async def fetch_weekly_offers(self) -> list[LidlOfferCandidate]:
        raise NotImplementedError("Lidl weekly offer ingestion is a legal/data approval stub.")
