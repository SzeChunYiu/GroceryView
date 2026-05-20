from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from .models import LatestPrice, PriceObservation, ProductSeed, QualityCheck, RawRetailerRecord, StoreSeed


def seed_stores() -> list[StoreSeed]:
    return [
        StoreSeed("store-willys-skanstull", "willys", "Willys", "Willys Skanstull", "Stockholm", Decimal("59.307600"), Decimal("18.076100")),
        StoreSeed("store-ica-torsplan", "ica", "ICA", "ICA Kvantum Torsplan", "Stockholm", Decimal("59.345900"), Decimal("18.035700")),
        StoreSeed("store-coop-medborgarplatsen", "coop", "Coop", "Coop Medborgarplatsen", "Stockholm", Decimal("59.314400"), Decimal("18.073600")),
    ]


def seed_products() -> list[ProductSeed]:
    return [
        ProductSeed("prod-arabica-coffee-450g", "Bryggkaffe Mellanrost 450 g", "Zoegas", Decimal("450"), "g", "coffee"),
        ProductSeed("prod-oat-milk-1l", "Havredryck 1 l", "Oatly", Decimal("1"), "l", "dairy_alternatives"),
        ProductSeed("prod-basmati-rice-1kg", "Basmatiris 1 kg", "Garant", Decimal("1"), "kg", "pantry"),
    ]


def retailer_fetch_stubs() -> list[RawRetailerRecord]:
    """Deterministic retailer fixture records; no live scraping or HTTP calls."""
    return [
        RawRetailerRecord(
            source_run_id="stub-run-2026-05-20",
            source_type="retailer_stub",
            source_name="willys",
            source_url="https://example.invalid/willys/stub/coffee",
            external_ref="willys:coffee:450g",
            observed_at="2026-05-20T06:00:00Z",
            payload={
                "productId": "prod-arabica-coffee-450g",
                "chainId": "willys",
                "storeId": "store-willys-skanstull",
                "displayPrice": "49.90",
                "regularPrice": "59.90",
                "unitPrice": "110.89",
                "priceType": "promotion",
                "confidence": "0.94",
            },
            provenance={
                "collector": "retailer_fetch_stubs",
                "source_kind": "fixture",
                "parser_version": "stub-v1",
                "capture_method": "checked_in_fixture",
            },
        ),
        RawRetailerRecord(
            source_run_id="stub-run-2026-05-20",
            source_type="retailer_stub",
            source_name="ica",
            source_url="https://example.invalid/ica/stub/oat-milk",
            external_ref="ica:oat-milk:1l",
            observed_at="2026-05-20T06:05:00Z",
            payload={
                "productId": "prod-oat-milk-1l",
                "chainId": "ica",
                "storeId": "store-ica-torsplan",
                "displayPrice": "22.50",
                "regularPrice": "22.50",
                "unitPrice": "22.50",
                "priceType": "shelf",
                "confidence": "0.98",
            },
            provenance={
                "collector": "retailer_fetch_stubs",
                "source_kind": "fixture",
                "parser_version": "stub-v1",
                "capture_method": "checked_in_fixture",
            },
        ),
        RawRetailerRecord(
            source_run_id="stub-run-2026-05-20",
            source_type="retailer_stub",
            source_name="coop",
            source_url="https://example.invalid/coop/stub/rice",
            external_ref="coop:rice:1kg",
            observed_at="2026-05-20T05:55:00Z",
            payload={
                "productId": "prod-basmati-rice-1kg",
                "chainId": "coop",
                "storeId": "store-coop-medborgarplatsen",
                "displayPrice": "34.90",
                "regularPrice": "34.90",
                "unitPrice": "34.90",
                "priceType": "online",
                "confidence": "0.90",
            },
            provenance={
                "collector": "retailer_fetch_stubs",
                "source_kind": "fixture",
                "parser_version": "stub-v1",
                "capture_method": "checked_in_fixture",
            },
        ),
    ]


def _money(value: object, field_name: str) -> Decimal:
    try:
        amount = Decimal(str(value))
    except Exception as exc:
        raise ValueError(f"{field_name} must be a decimal-compatible value") from exc
    if amount < 0:
      raise ValueError(f"{field_name} must be non-negative")
    return amount.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _confidence(value: object) -> Decimal:
    score = Decimal(str(value))
    if score < 0 or score > 1:
        raise ValueError("confidence must be between 0 and 1")
    return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def normalize_retailer_records(records: list[RawRetailerRecord]) -> list[PriceObservation]:
    observations: list[PriceObservation] = []

    for record in records:
        payload = record.payload
        price_type = str(payload["priceType"])
        if price_type not in {"shelf", "online", "member", "promotion", "receipt", "community", "estimated"}:
            raise ValueError(f"unsupported priceType for {record.external_ref}: {price_type}")

        observations.append(
            PriceObservation(
                product_id=str(payload["productId"]),
                chain_id=str(payload["chainId"]),
                store_id=str(payload["storeId"]) if payload.get("storeId") else None,
                raw_record_ref=record.external_ref,
                price_type=price_type,  # type: ignore[arg-type]
                price=_money(payload["displayPrice"], "displayPrice"),
                regular_price=_money(payload["regularPrice"], "regularPrice") if payload.get("regularPrice") is not None else None,
                unit_price=_money(payload["unitPrice"], "unitPrice"),
                currency="SEK",
                observed_at=record.observed_at,
                confidence=_confidence(payload["confidence"]),
                source_type=record.source_type,
                source_name=record.source_name,
                source_url=record.source_url,
                provenance={
                    **record.provenance,
                    "source_run_id": record.source_run_id,
                    "raw_record_ref": record.external_ref,
                    "original_display_price": payload["displayPrice"],
                },
            )
        )

    return observations


def build_latest_price_rollup(observations: list[PriceObservation]) -> list[LatestPrice]:
    latest: dict[tuple[str, str, str | None, str], PriceObservation] = {}
    for observation in observations:
        key = (observation.product_id, observation.chain_id, observation.store_id, observation.price_type)
        current = latest.get(key)
        if current is None or (observation.observed_at, observation.raw_record_ref) > (current.observed_at, current.raw_record_ref):
            latest[key] = observation

    return [
        LatestPrice(
            product_id=observation.product_id,
            chain_id=observation.chain_id,
            store_id=observation.store_id,
            price_type=observation.price_type,
            observation_ref=observation.raw_record_ref,
            price=observation.price,
            regular_price=observation.regular_price,
            unit_price=observation.unit_price,
            currency=observation.currency,
            observed_at=observation.observed_at,
            confidence=observation.confidence,
            provenance=observation.provenance,
        )
        for observation in sorted(latest.values(), key=lambda item: (item.product_id, item.chain_id, item.store_id or "", item.price_type))
    ]


def collect_quality_checks(
    stores: list[StoreSeed],
    products: list[ProductSeed],
    raw_records: list[RawRetailerRecord],
    observations: list[PriceObservation],
    latest_prices: list[LatestPrice],
) -> list[QualityCheck]:
    store_ids = {store.id for store in stores}
    product_ids = {product.id for product in products}

    missing_products = [observation.raw_record_ref for observation in observations if observation.product_id not in product_ids]
    missing_stores = [
        observation.raw_record_ref
        for observation in observations
        if observation.store_id is not None and observation.store_id not in store_ids
    ]
    missing_provenance = [
        record.external_ref
        for record in raw_records
        if not record.provenance.get("parser_version") or not record.provenance.get("source_kind")
    ]
    latest_keys = {(price.product_id, price.chain_id, price.store_id, price.price_type) for price in latest_prices}
    observation_keys = {(item.product_id, item.chain_id, item.store_id, item.price_type) for item in observations}

    return [
        QualityCheck("observations_reference_seed_products", not missing_products, len(observations), missing_products),
        QualityCheck("observations_reference_seed_stores", not missing_stores, len(observations), missing_stores),
        QualityCheck("raw_records_include_parser_provenance", not missing_provenance, len(raw_records), missing_provenance),
        QualityCheck(
            "latest_prices_cover_observation_keys",
            latest_keys == observation_keys,
            len(latest_prices),
            sorted(":".join(part or "online" for part in key) for key in observation_keys - latest_keys),
        ),
    ]
