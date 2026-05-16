"""Open Food Facts and Open Prices supplemental ingestion stubs."""

from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance

PRODUCT_API = "https://world.openfoodfacts.org/api/v2/product/{barcode}.json"
OPEN_PRICES_API = "https://prices.openfoodfacts.org/api/v1/"


class OpenFoodFactsScraper:
    source_name = "open_food_facts"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://world.openfoodfacts.org/robots.txt",
        requires_partner_approval=False,
        notes=(
            "use custom User-Agent and observe Open Food Facts rate limits/licenses",
            "metadata source_type=open_food_facts_catalog",
            (
                "community prices source_type=open_prices_community confidence_score=0.50 "
                "pending verification"
            ),
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=1)

    async def fetch_product_metadata(self, barcode: str) -> None:
        raise NotImplementedError(
            "OFF metadata fetching is stubbed until category seed scope is set."
        )

    async def fetch_open_prices(self, barcode: str) -> None:
        raise NotImplementedError(
            "Open Prices ingestion is stubbed pending coverage/license review."
        )
