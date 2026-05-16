"""Coop API-discovery placeholder, not an unauthorized scraper."""

from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance

API_PORTAL = "https://portal.api.coop.se/"


class CoopScraper:
    source_name = "coop"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://www.coop.se/robots.txt",
        requires_partner_approval=True,
        notes=(
            "apply through Coop API Catalog before current-price ingestion",
            "record required auth/store context after approval",
            "weekly offers or user receipts can be ingested separately",
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=10)

    async def fetch_current_prices(self) -> None:
        raise NotImplementedError(
            "Coop current-price ingestion requires partner/API approval; weekly offers or user "
            "receipts can be ingested separately."
        )
