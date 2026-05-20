from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Iterable

try:
    from dagster import asset
except ModuleNotFoundError:
    def asset(**_kwargs):
        def decorator(fn):
            return fn

        return decorator

from .fixtures import FETCHED_AT, HERO_PRODUCTS, RETAILER_PRICE_SNAPSHOT, STOCKHOLM_STORES
from .models import (
    LatestPriceRow,
    ObservationCoverageSummary,
    ObservationFreshnessSummary,
    OpenPricesPullPlan,
    PriceObservationRow,
    PriceObservationMixSummary,
    PriceProvenance,
    ProductSeed,
    QualityCheckSummary,
    RetailerFetchStub,
    StoreSeed,
)

ASSET_GROUP = "data_pipeline"
OBSERVED_AT = FETCHED_AT
PARSER_VERSION = "demo-retailer-stub-v1"
OPEN_PRICES_PARSER_VERSION = "open-prices-v1"
OPEN_PRICES_ENDPOINT_URL = "https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10&location__osm_address_country_code=SE&order_by=-date"


def build_seed_stores() -> list[StoreSeed]:
    return sorted(
        (StoreSeed(**store) for store in STOCKHOLM_STORES), key=lambda store: store.slug
    )


def build_seed_products() -> list[ProductSeed]:
    return sorted(
        (ProductSeed(**product) for product in HERO_PRODUCTS), key=lambda product: product.slug
    )


def _unit_price(price_amount: float, unit_size: float) -> float | None:
    if unit_size <= 0:
        return None
    return round(price_amount / unit_size, 2)


def build_retailer_fetch_stubs(
    stores: Iterable[StoreSeed], products: Iterable[ProductSeed]
) -> list[RetailerFetchStub]:
    product_by_slug = {product.slug: product for product in products}
    stubs: list[RetailerFetchStub] = []

    for store in sorted(stores, key=lambda store: store.slug):
        store_snapshot = RETAILER_PRICE_SNAPSHOT.get(store.slug, {})
        for product_slug, price_snapshot in sorted(store_snapshot.items()):
            product = product_by_slug.get(product_slug)
            if product is None:
                continue
            observed_at = OBSERVED_AT
            price_amount = float(price_snapshot["price_amount"])
            confidence = float(price_snapshot["confidence"])
            price_type = str(price_snapshot["price_type"])
            confidence_label = str(price_snapshot["label"])
            provenance = PriceProvenance(
                source_type="retailer_page",
                source_name=f"{store.chain} demo retailer page",
                source_url=f"https://example.com/{store.slug}/{product.slug}",
                source_run_id=f"demo-run-{store.slug}-{product.slug}",
                raw_record_id=f"raw-{store.slug}-{product.slug}",
                raw_snapshot_ref=f"s3://groceryview-raw/{store.slug}/{product.slug}.json",
                fetched_at=FETCHED_AT,
                observed_at=observed_at,
                parser_version=PARSER_VERSION,
            )
            stubs.append(
                RetailerFetchStub(
                    store_slug=store.slug,
                    product_slug=product.slug,
                    price_amount=price_amount,
                    unit=product.unit,
                    unit_size=product.unit_size,
                    unit_price_amount=_unit_price(price_amount, product.unit_size),
                    unit_price_unit="kg" if product.category in {"fruit", "coffee"} else product.unit,
                    price_type=price_type,
                    source_type="retailer_page",
                    confidence=clamp_confidence(confidence),
                    confidence_label=confidence_label,
                    member_only=price_type == "member",
                    promotion_label="Demo promo" if price_type == "promotion" else None,
                    valid_from=None,
                    valid_to=None,
                    provenance=provenance,
                )
            )

    return stubs


def build_normalized_products(products: Iterable[ProductSeed]) -> list[dict[str, object]]:
    return [
        {
            "product_slug": product.slug,
            "canonical_name": product.name,
            "brand": product.brand,
            "category": product.category,
            "unit": product.unit,
            "unit_size": product.unit_size,
            "aliases": sorted({product.name.lower(), product.brand.lower()}),
            "source_type": "manual_admin",
        }
        for product in products
    ]


def build_price_observations(
    stubs: Iterable[RetailerFetchStub], normalized_products: Iterable[dict[str, object]]
) -> list[PriceObservationRow]:
    normalized_product_lookup = {
        product["product_slug"]: product for product in normalized_products
    }
    observations: list[PriceObservationRow] = []

    for stub in stubs:
        normalized = normalized_product_lookup.get(stub.product_slug)
        if normalized is None:
            continue
        unit = str(normalized["unit"])
        unit_size = float(normalized["unit_size"])
        observations.append(
            PriceObservationRow(
                product_slug=stub.product_slug,
                store_slug=stub.store_slug,
                price_amount=stub.price_amount,
                unit=unit,
                unit_price_amount=_unit_price(stub.price_amount, unit_size),
                unit_price_unit=stub.unit_price_unit,
                price_type=stub.price_type,
                observed_at=stub.provenance.observed_at,
                source_type=stub.source_type,
                confidence=stub.confidence,
                confidence_label=stub.confidence_label,
                provenance=stub.provenance,
                member_only=stub.member_only,
                promotion_label=stub.promotion_label,
                valid_from=stub.valid_from,
                valid_to=stub.valid_to,
            )
        )

    return observations


def build_latest_price_rollup(
    observations: Iterable[PriceObservationRow],
) -> list[LatestPriceRow]:
    grouped: dict[tuple[str, str], PriceObservationRow] = {}

    for observation in observations:
        key = (observation.product_slug, observation.store_slug)
        current = grouped.get(key)
        if current is None:
            grouped[key] = observation
            continue
        if (
            observation.observed_at > current.observed_at
            or (
                observation.observed_at == current.observed_at
                and observation.confidence > current.confidence
            )
        ):
            grouped[key] = observation

    return [
        LatestPriceRow(
            product_slug=observation.product_slug,
            store_slug=observation.store_slug,
            observed_at=observation.observed_at,
            price_amount=observation.price_amount,
            price_type=observation.price_type,
            source_type=observation.source_type,
            confidence_label=observation.confidence_label,
            provenance=observation.provenance,
        )
        for observation in grouped.values()
    ]


def build_quality_checks(
    fetch_stubs: Iterable[RetailerFetchStub],
    observations: Iterable[PriceObservationRow],
    latest_rollup: Iterable[LatestPriceRow],
) -> QualityCheckSummary:
    observation_list = list(observations)
    latest_list = list(latest_rollup)
    fetch_stub_list = list(fetch_stubs)

    def _is_complete_provenance(provenance: PriceProvenance) -> bool:
        return (
            bool(provenance.source_type)
            and bool(provenance.source_name)
            and bool(provenance.source_run_id)
            and bool(provenance.raw_record_id)
            and bool(provenance.observed_at)
            and bool(provenance.fetched_at)
            and bool(provenance.parser_version)
        )

    missing_provenance = [
        observation
        for observation in observation_list
        if not _is_complete_provenance(observation.provenance)
    ]
    missing_fetch_stub_provenance = [
        stub
        for stub in fetch_stub_list
        if not _is_complete_provenance(stub.provenance)
    ]
    duplicate_keys: dict[tuple[str, str], int] = defaultdict(int)
    for observation in observation_list:
        duplicate_keys[(observation.product_slug, observation.store_slug)] += 1

    duplicate_key_count = sum(1 for count in duplicate_keys.values() if count > 1)
    source_types = sorted({observation.source_type for observation in observation_list})

    return QualityCheckSummary(
        observation_count=len(observation_list),
        latest_rollup_count=len(latest_list),
        missing_provenance_count=len(missing_provenance),
        missing_fetch_stub_provenance_count=len(missing_fetch_stub_provenance),
        duplicate_key_count=duplicate_key_count,
        source_types=source_types,
        fetch_stub_count=len(fetch_stub_list),
    )


def _parse_utc_datetime(value: object) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    normalized = f"{value[:-1]}+00:00" if value.endswith("Z") else value
    try:
        parsed = datetime.fromisoformat(normalized)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def build_observation_freshness_summary(
    observations: Iterable[PriceObservationRow],
    checked_at: str,
    max_age_hours: int,
) -> ObservationFreshnessSummary:
    checked_at_dt = _parse_utc_datetime(checked_at)
    max_age = timedelta(hours=max_age_hours)
    observation_list = list(observations)
    fresh_count = 0
    stale_count = 0
    future_count = 0
    missing_observed_at_count = 0

    for observation in observation_list:
        observed_at = _parse_utc_datetime(observation.observed_at)
        if observed_at is None or checked_at_dt is None:
            missing_observed_at_count += 1
            continue
        age = checked_at_dt - observed_at
        if age < timedelta(0):
            future_count += 1
        elif age > max_age:
            stale_count += 1
        else:
            fresh_count += 1

    blocked_count = stale_count + future_count + missing_observed_at_count
    return ObservationFreshnessSummary(
        status="ready" if blocked_count == 0 else "blocked",
        observation_count=len(observation_list),
        fresh_count=fresh_count,
        stale_count=stale_count,
        future_count=future_count,
        missing_observed_at_count=missing_observed_at_count,
        max_age_hours=max_age_hours,
        checked_at=checked_at,
    )


def build_open_prices_pull_plan(open_prices_user_agent_present: bool = False) -> OpenPricesPullPlan:
    return OpenPricesPullPlan(
        status="ready" if open_prices_user_agent_present else "blocked",
        source_type="open_data",
        endpoint_url=OPEN_PRICES_ENDPOINT_URL,
        parser_version=OPEN_PRICES_PARSER_VERSION,
        required_env=["OPEN_PRICES_USER_AGENT"],
        required_actions=[] if open_prices_user_agent_present else ["set_open_prices_user_agent", "run_open_prices_smoke"],
        smoke_command="OPEN_PRICES_USER_AGENT=<app/version contact> infra/scripts/smoke-open-prices.sh",
        evidence_fields=[
            "sourceUrl",
            "statusCode",
            "contentHash",
            "rawSnapshotRef",
            "acceptedCount",
            "firstProduct",
        ],
    )


def build_observation_coverage_summary(
    observations: Iterable[PriceObservationRow],
    stores: Iterable[StoreSeed],
    products: Iterable[ProductSeed],
) -> ObservationCoverageSummary:
    observation_list = list(observations)
    expected_stores = {store.slug for store in stores}
    expected_products = {product.slug for product in products}
    covered_stores = {observation.store_slug for observation in observation_list}
    covered_products = {observation.product_slug for observation in observation_list}
    missing_store_count = len(expected_stores - covered_stores)
    missing_product_count = len(expected_products - covered_products)

    return ObservationCoverageSummary(
        status="ready" if missing_store_count == 0 and missing_product_count == 0 else "partial",
        observation_count=len(observation_list),
        store_count=len(expected_stores),
        covered_store_count=len(expected_stores & covered_stores),
        missing_store_count=missing_store_count,
        product_count=len(expected_products),
        covered_product_count=len(expected_products & covered_products),
        missing_product_count=missing_product_count,
    )


def _count_values(values: Iterable[str]) -> dict[str, int]:
    counts: dict[str, int] = defaultdict(int)
    for value in values:
        counts[value] += 1
    return dict(sorted(counts.items()))


def build_price_observation_mix_summary(observations: Iterable[PriceObservationRow]) -> PriceObservationMixSummary:
    observation_list = list(observations)
    return PriceObservationMixSummary(
        observation_count=len(observation_list),
        price_types=_count_values(observation.price_type for observation in observation_list),
        confidence_labels=_count_values(observation.confidence_label for observation in observation_list),
        source_types=_count_values(observation.source_type for observation in observation_list),
        member_only_count=sum(1 for observation in observation_list if observation.member_only),
        promotion_count=sum(1 for observation in observation_list if observation.price_type == "promotion"),
    )


def clamp_confidence(confidence: float) -> float:
    if confidence < 0:
        return 0
    if confidence > 1:
        return 1
    return confidence


@asset(group_name=ASSET_GROUP)
def seed_stores() -> list[dict[str, object]]:
    return [store.to_dict() for store in build_seed_stores()]


@asset(group_name=ASSET_GROUP)
def seed_products() -> list[dict[str, object]]:
    return [product.to_dict() for product in build_seed_products()]


@asset(group_name=ASSET_GROUP)
def retailer_fetch_stubs(
    seed_stores: list[dict[str, object]], seed_products: list[dict[str, object]]
) -> list[dict[str, object]]:
    stores = [StoreSeed(**store) for store in seed_stores]
    products = [ProductSeed(**product) for product in seed_products]
    return [stub.to_dict() for stub in build_retailer_fetch_stubs(stores, products)]


@asset(group_name=ASSET_GROUP)
def normalized_products(seed_products: list[dict[str, object]]) -> list[dict[str, object]]:
    products = [ProductSeed(**product) for product in seed_products]
    return build_normalized_products(products)


@asset(group_name=ASSET_GROUP)
def price_observations(
    retailer_fetch_stubs: list[dict[str, object]],
    normalized_products: list[dict[str, object]],
) -> list[dict[str, object]]:
    stubs = [
        RetailerFetchStub(
            provenance=PriceProvenance(**stub["provenance"]),
            **{key: value for key, value in stub.items() if key != "provenance"},
        )
        for stub in retailer_fetch_stubs
    ]
    observations = build_price_observations(stubs, normalized_products)
    return [observation.to_dict() for observation in observations]


@asset(group_name=ASSET_GROUP)
def latest_price_rollup(
    price_observations: list[dict[str, object]],
) -> list[dict[str, object]]:
    observations = [
        PriceObservationRow(
            provenance=PriceProvenance(**observation["provenance"]),
            **{key: value for key, value in observation.items() if key != "provenance"},
        )
        for observation in price_observations
    ]
    latest_rows = build_latest_price_rollup(observations)
    return [latest_row.to_dict() for latest_row in latest_rows]


@asset(group_name=ASSET_GROUP)
def quality_checks(
    retailer_fetch_stubs: list[dict[str, object]],
    price_observations: list[dict[str, object]],
    latest_price_rollup: list[dict[str, object]],
) -> dict[str, object]:
    fetch_stubs = [
        RetailerFetchStub(
            provenance=PriceProvenance(**stub["provenance"]),
            **{key: value for key, value in stub.items() if key != "provenance"},
        )
        for stub in retailer_fetch_stubs
    ]
    observations = [
        PriceObservationRow(
            provenance=PriceProvenance(**observation["provenance"]),
            **{key: value for key, value in observation.items() if key != "provenance"},
        )
        for observation in price_observations
    ]
    rollup = [
        LatestPriceRow(
            provenance=PriceProvenance(**row["provenance"]),
            **{key: value for key, value in row.items() if key != "provenance"},
        )
        for row in latest_price_rollup
    ]
    summary = build_quality_checks(fetch_stubs, observations, rollup)
    return summary.to_dict()


@asset(group_name=ASSET_GROUP)
def price_observation_freshness(price_observations: list[dict[str, object]]) -> dict[str, object]:
    observations = [
        PriceObservationRow(
            provenance=PriceProvenance(**observation["provenance"]),
            **{key: value for key, value in observation.items() if key != "provenance"},
        )
        for observation in price_observations
    ]
    summary = build_observation_freshness_summary(observations, checked_at=OBSERVED_AT, max_age_hours=48)
    return summary.to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_real_pull_plan() -> dict[str, object]:
    return build_open_prices_pull_plan(open_prices_user_agent_present=False).to_dict()


@asset(group_name=ASSET_GROUP)
def price_observation_coverage(
    seed_stores: list[dict[str, object]],
    seed_products: list[dict[str, object]],
    price_observations: list[dict[str, object]],
) -> dict[str, object]:
    stores = [StoreSeed(**store) for store in seed_stores]
    products = [ProductSeed(**product) for product in seed_products]
    observations = [
        PriceObservationRow(
            provenance=PriceProvenance(**observation["provenance"]),
            **{key: value for key, value in observation.items() if key != "provenance"},
        )
        for observation in price_observations
    ]
    summary = build_observation_coverage_summary(observations, stores, products)
    return summary.to_dict()


@asset(group_name=ASSET_GROUP)
def price_observation_mix(price_observations: list[dict[str, object]]) -> dict[str, object]:
    observations = [
        PriceObservationRow(
            provenance=PriceProvenance(**observation["provenance"]),
            **{key: value for key, value in observation.items() if key != "provenance"},
        )
        for observation in price_observations
    ]
    summary = build_price_observation_mix_summary(observations)
    return summary.to_dict()
