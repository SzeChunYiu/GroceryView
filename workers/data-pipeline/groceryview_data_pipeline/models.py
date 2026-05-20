from __future__ import annotations

from dataclasses import dataclass, field
from decimal import Decimal
from typing import Literal


PriceType = Literal["shelf", "online", "member", "promotion", "receipt", "community", "estimated"]
SourceType = Literal["retailer_stub"]


@dataclass(frozen=True)
class StoreSeed:
    id: str
    chain_id: str
    chain_name: str
    name: str
    city: str
    latitude: Decimal
    longitude: Decimal


@dataclass(frozen=True)
class ProductSeed:
    id: str
    canonical_name: str
    brand: str
    quantity: Decimal
    quantity_unit: str
    category: str


@dataclass(frozen=True)
class RawRetailerRecord:
    source_run_id: str
    source_type: SourceType
    source_name: str
    source_url: str
    external_ref: str
    observed_at: str
    payload: dict[str, object]
    provenance: dict[str, object]


@dataclass(frozen=True)
class PriceObservation:
    product_id: str
    chain_id: str
    store_id: str | None
    raw_record_ref: str
    price_type: PriceType
    price: Decimal
    regular_price: Decimal | None
    unit_price: Decimal
    currency: str
    observed_at: str
    confidence: Decimal
    source_type: SourceType
    source_name: str
    source_url: str
    provenance: dict[str, object]


@dataclass(frozen=True)
class LatestPrice:
    product_id: str
    chain_id: str
    store_id: str | None
    price_type: PriceType
    observation_ref: str
    price: Decimal
    regular_price: Decimal | None
    unit_price: Decimal
    currency: str
    observed_at: str
    confidence: Decimal
    provenance: dict[str, object]


@dataclass(frozen=True)
class QualityCheck:
    name: str
    passed: bool
    checked_count: int
    failures: list[str] = field(default_factory=list)
