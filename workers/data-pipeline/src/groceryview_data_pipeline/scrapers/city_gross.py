"""City Gross discovery stub for Stockholm product/price endpoints."""

from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance


class CityGrossDiscoveryScraper:
    source_name = "city_gross"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://www.citygross.se/robots.txt",
        requires_partner_approval=True,
        notes=(
            "document Stockholm product and price endpoint availability before implementation",
            "do not assume source coverage or permission without discovery/legal review",
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=10)

    async def fetch(self) -> None:
        raise NotImplementedError("City Gross ingestion starts as documented discovery only.")
