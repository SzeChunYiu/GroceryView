"""Normalized observation contracts for all GroceryView source ingestion."""

from datetime import UTC, datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

SourceType = Literal[
    "willys_online_json",
    "hemkop_online_json",
    "ica_per_store_json",
    "lidl_weekly_offer",
    "coop_partner_api",
    "open_food_facts_catalog",
    "open_prices_community",
    "manual_seed",
]

PriceType = Literal[
    "online",
    "online_or_store_context",
    "regular",
    "member",
    "promo",
    "flyer_or_promo",
    "receipt",
    "shelf_photo",
    "manual",
    "estimated",
]

Currency = Literal["SEK"]


class ObservationBase(BaseModel):
    """Shared provenance every parsed or normalized row must preserve."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    source_type: SourceType
    source_url: HttpUrl | str
    observed_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))
    price_type: PriceType
    currency: Currency = "SEK"
    confidence_score: float = Field(ge=0.0, le=1.0)
    raw_snapshot_hash: str = Field(min_length=16)
    parser_version: str = Field(min_length=1)
    store_id: str | None = None
    retailer_store_id: str | None = None

    @field_validator("observed_at")
    @classmethod
    def observed_at_must_be_timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("observed_at must be timezone-aware")
        return value


class RawSourceRecord(ObservationBase):
    """Immutable pointer to raw JSON/HTML saved before parsing."""

    raw_storage_uri: str
    source_name: str
    content_type: Literal["application/json", "text/html", "text/plain"]
    payload_size_bytes: int = Field(ge=0)


class NormalizedProduct(ObservationBase):
    """Retailer product normalized toward GroceryView canonical catalog."""

    retailer_product_id: str | None = None
    gtin: str | None = None
    name: str
    brand: str | None = None
    manufacturer: str | None = None
    category_path: list[str] = Field(default_factory=list)
    package_size: str | None = None
    image_urls: list[str] = Field(default_factory=list)
    labels: list[str] = Field(default_factory=list)


class PriceObservation(ObservationBase):
    """A single observed product price at a point in time."""

    product_key: str
    retailer_product_id: str | None = None
    price: float = Field(gt=0.0)
    compare_price: float | None = Field(default=None, gt=0.0)
    compare_price_unit: str | None = None
    price_unit: str | None = None
    unit_size: str | None = None
    is_online_price: bool = False
    is_instore_price: bool = False
    promotion_id: str | None = None


class PromotionObservation(ObservationBase):
    """Promotion/member/flyer metadata associated with a product observation."""

    product_key: str
    promotion_id: str | None = None
    campaign_text: str | None = None
    valid_from: datetime | None = None
    valid_to: datetime | None = None
    member_only: bool = False
    offer_price: float | None = Field(default=None, gt=0.0)
    compare_price: float | None = Field(default=None, gt=0.0)


class RetailerFetchResult(BaseModel):
    """Result envelope returned by retailer scrapers before persistence."""

    model_config = ConfigDict(extra="forbid", frozen=True)

    source_name: str
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))
    source_url: HttpUrl | str
    raw_snapshot_hash: str = Field(min_length=16)
    raw_storage_uri: str | None = None
    raw_records: list[RawSourceRecord] = Field(default_factory=list)
    products: list[NormalizedProduct] = Field(default_factory=list)
    prices: list[PriceObservation] = Field(default_factory=list)
    promotions: list[PromotionObservation] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)

    @field_validator("fetched_at")
    @classmethod
    def fetched_at_must_be_timezone_aware(cls, value: datetime) -> datetime:
        if value.tzinfo is None or value.utcoffset() is None:
            raise ValueError("fetched_at must be timezone-aware")
        return value
