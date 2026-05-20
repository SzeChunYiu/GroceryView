from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from typing import Literal, TypedDict

PriceType = Literal[
    "regular",
    "promotion",
    "member",
    "online",
    "flyer",
    "in_store",
    "receipt",
    "shelf_photo",
    "manual",
    "estimated",
    "clearance",
]

SourceType = Literal[
    "retailer_page",
    "retailer_api",
    "flyer",
    "receipt",
    "shelf_photo",
    "manual_admin",
    "open_data",
    "estimated",
]

ConfidenceBand = Literal["verified", "high", "medium", "low", "estimated"]


@dataclass(frozen=True)
class PriceProvenance:
    source_type: SourceType
    source_name: str
    source_url: str | None
    source_run_id: str
    raw_record_id: str
    raw_snapshot_ref: str | None
    fetched_at: str
    observed_at: str
    parser_version: str

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class StoreSeed:
    id: str
    slug: str
    name: str
    chain: str
    city: str
    district: str
    latitude: float
    longitude: float

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class ProductSeed:
    id: str
    slug: str
    ean: str
    name: str
    brand: str
    category: str
    unit: str
    unit_size: float

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class RetailerFetchStub:
    store_slug: str
    product_slug: str
    price_amount: float
    unit: str
    unit_size: float
    unit_price_amount: float | None
    unit_price_unit: str | None
    price_type: PriceType
    source_type: SourceType
    confidence: float
    confidence_label: ConfidenceBand
    member_only: bool
    promotion_label: str | None
    valid_from: str | None
    valid_to: str | None
    provenance: PriceProvenance

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["provenance"] = self.provenance.to_dict()
        return payload


@dataclass(frozen=True)
class PriceObservationRow:
    product_slug: str
    store_slug: str
    price_amount: float
    unit: str
    unit_price_amount: float | None
    unit_price_unit: str | None
    price_type: PriceType
    observed_at: str
    source_type: SourceType
    confidence: float
    confidence_label: ConfidenceBand
    provenance: PriceProvenance
    member_only: bool
    promotion_label: str | None
    valid_from: str | None
    valid_to: str | None
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["provenance"] = self.provenance.to_dict()
        return payload


@dataclass(frozen=True)
class LatestPriceRow:
    product_slug: str
    store_slug: str
    observed_at: str
    price_amount: float
    price_type: PriceType
    source_type: SourceType
    confidence_label: ConfidenceBand
    provenance: PriceProvenance
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        payload = asdict(self)
        payload["provenance"] = self.provenance.to_dict()
        return payload


@dataclass(frozen=True)
class QualityCheckSummary:
    observation_count: int
    latest_rollup_count: int
    missing_provenance_count: int
    missing_fetch_stub_provenance_count: int
    duplicate_key_count: int
    source_types: list[str]
    fetch_stub_count: int
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class ObservationFreshnessSummary:
    status: Literal["ready", "blocked"]
    observation_count: int
    fresh_count: int
    stale_count: int
    future_count: int
    missing_observed_at_count: int
    max_age_hours: int
    checked_at: str
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class OpenPricesPullPlan:
    status: Literal["ready", "blocked"]
    source_type: SourceType
    endpoint_url: str
    parser_version: str
    required_env: list[str]
    required_actions: list[str]
    smoke_command: str
    evidence_fields: list[str]
    demo: bool = False

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class ObservationCoverageSummary:
    status: Literal["ready", "partial"]
    observation_count: int
    store_count: int
    covered_store_count: int
    missing_store_count: int
    product_count: int
    covered_product_count: int
    missing_product_count: int
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


@dataclass(frozen=True)
class PriceObservationMixSummary:
    observation_count: int
    price_types: dict[str, int]
    confidence_labels: dict[str, int]
    source_types: dict[str, int]
    member_only_count: int
    promotion_count: int
    demo: bool = True

    def to_dict(self) -> dict[str, object]:
        return asdict(self)


def utc_now() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


class AssetPayload(TypedDict):
    value: list[dict[str, object]] | dict[str, object]
