"""ICA store seed and per-store price scraper placeholder."""

from dataclasses import dataclass

from groceryview_data_pipeline.scrapers.base import RateLimit, SourceCompliance

STORE_ENDPOINT_TEMPLATE = (
    "https://handla.ica.se/api/store/v1?zipCode={zip_code}&customerType=private"
)
PRODUCT_ENDPOINT_PLACEHOLDER = (
    "https://handla.ica.se/api/retailItems/v1?storeId={store_id}&categoryId={category_id}"
)
STOCKHOLM_LAT_RANGE = (59.1, 59.5)
STOCKHOLM_LON_RANGE = (17.8, 18.2)


@dataclass(frozen=True)
class IcaStoreSeed:
    retailer_store_id: str
    name: str
    address: str | None
    latitude: float
    longitude: float


def is_stockholm_area_store(latitude: float, longitude: float) -> bool:
    return (
        STOCKHOLM_LAT_RANGE[0] <= latitude <= STOCKHOLM_LAT_RANGE[1]
        and STOCKHOLM_LON_RANGE[0] <= longitude <= STOCKHOLM_LON_RANGE[1]
    )


class IcaStoreScraper:
    source_name = "ica"
    compliance = SourceCompliance(
        source_name=source_name,
        robots_url="https://handla.ica.se/robots.txt",
        requires_partner_approval=True,
        notes=(
            "store locator is suitable for Stockholm seeds",
            (
                "product endpoint remains disabled until legal/technical approval confirms "
                "permitted store context handling"
            ),
            "planned source_type=ica_per_store_json, price_type=online_or_store_context",
        ),
    )
    rate_limit = RateLimit(minimum_seconds_between_requests=10)

    async def fetch_store_seed(self, zip_code: str = "11322") -> list[IcaStoreSeed]:
        raise NotImplementedError("ICA store seed network fetching is disabled in the scaffold.")

    async def fetch_store_products(self, store_id: str, category_id: str) -> None:
        raise NotImplementedError(
            "ICA product price ingestion requires approval for store-context handling."
        )
