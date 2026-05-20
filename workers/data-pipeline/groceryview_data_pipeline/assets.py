from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Iterable
from urllib.parse import urlparse

try:
    from dagster import asset
except ModuleNotFoundError:
    def asset(**_kwargs):
        def decorator(fn):
            return fn

        return decorator

from .fixtures import FETCHED_AT, HERO_PRODUCTS, RETAILER_PRICE_SNAPSHOT, STOCKHOLM_STORES
from .models import (
    DataPipelineQualityGateDigest,
    DataPipelineQualityGateSummary,
    LatestPriceRow,
    ObservationCoverageSummary,
    ObservationFreshnessSummary,
    OpenPricesArtifactImportPlan,
    OpenPricesArtifactImportPlanSummary,
    OpenPricesHostedSmokePlan,
    OpenPricesHostedSmokePlanSummary,
    OpenPricesIngestionRunPlan,
    OpenPricesIngestionRunPlanSummary,
    OpenPricesLaunchReadinessDigest,
    OpenPricesLaunchReadinessSummary,
    OpenPricesPullPlan,
    OpenPricesScheduleHealthPlan,
    OpenPricesScheduleHealthPlanSummary,
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


def _normalize_hosted_smoke_url(url: str) -> str | None:
    normalized_url = url.strip().rstrip("/")
    parsed_url = urlparse(normalized_url)
    if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
        return None
    return normalized_url


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
        smoke_command=(
            "OPEN_PRICES_USER_AGENT=<app/version contact> "
            "OPEN_PRICES_OUTPUT_PATH=/tmp/groceryview-open-prices-preview.json "
            "infra/scripts/smoke-open-prices.sh"
        ),
        evidence_fields=[
            "sourceUrl",
            "statusCode",
            "contentHash",
            "rawSnapshotRef",
            "acceptedCount",
            "firstProduct",
        ],
        evidence_artifacts=[
            "/tmp/groceryview-open-prices-preview.json",
        ],
    )


def build_open_prices_ingestion_run_plan(
    *,
    open_prices_user_agent_present: bool = False,
    database_url_present: bool = False,
    raw_snapshot_storage_present: bool = False,
    schedule_enabled: bool = False,
) -> OpenPricesIngestionRunPlan:
    required_actions: list[str] = []
    if not open_prices_user_agent_present:
        required_actions.append("set_open_prices_user_agent")
    if not database_url_present:
        required_actions.append("set_database_url")
    if not raw_snapshot_storage_present:
        required_actions.append("configure_raw_snapshot_storage")
    if not schedule_enabled:
        required_actions.append("enable_open_prices_schedule")

    return OpenPricesIngestionRunPlan(
        status="ready" if not required_actions else "blocked",
        source_asset="open_prices_real_pull_plan",
        schedule_cron="17 */6 * * *",
        freshness_sla_hours=8,
        required_env=[
            "OPEN_PRICES_USER_AGENT",
            "DATABASE_URL",
            "GROCERYVIEW_RAW_SNAPSHOT_BUCKET",
            "OPEN_PRICES_SCHEDULE_ENABLED",
        ],
        required_actions=required_actions,
        materialization_assets=[
            "open_prices_real_pull_plan",
            "price_observations",
            "latest_price_rollup",
            "price_observation_freshness",
            "price_observation_coverage",
        ],
        persistence_targets=[
            "raw_snapshots",
            "source_runs",
            "raw_price_records",
            "price_observations",
            "latest_prices",
        ],
        idempotency_key_fields=[
            "source_type",
            "source_url",
            "content_hash",
            "parser_version",
            "observed_at",
        ],
        evidence_fields=[
            "runKey",
            "sourceUrl",
            "contentHash",
            "rawSnapshotRef",
            "acceptedCount",
            "persistedObservationCount",
            "latestRollupCount",
            "freshnessStatus",
        ],
    )


def build_open_prices_artifact_import_plan(
    *,
    database_url_present: bool = False,
    input_artifact_present: bool = False,
    db_package_built: bool = False,
) -> OpenPricesArtifactImportPlan:
    required_actions: list[str] = []
    if not database_url_present:
        required_actions.append("set_database_url")
    if not input_artifact_present:
        required_actions.append("provide_open_prices_input_artifact")
    if not db_package_built:
        required_actions.append("build_groceryview_db_package")

    return OpenPricesArtifactImportPlan(
        status="ready" if not required_actions else "blocked",
        source_asset="open_prices_real_pull_plan",
        import_command=(
            "npm run build --workspace @groceryview/db && "
            "DATABASE_URL=<postgres-url> "
            "OPEN_PRICES_INPUT_PATH=<artifact.json> "
            "OPEN_PRICES_IMPORT_RESULT_PATH=/tmp/groceryview-open-prices-import-result.json "
            "infra/scripts/import-open-prices-artifact.sh"
        ),
        required_env=["DATABASE_URL", "OPEN_PRICES_INPUT_PATH"],
        required_actions=required_actions,
        required_packages=["@groceryview/db", "pg"],
        database_targets=[
            "source_runs",
            "raw_records",
            "products",
            "aliases",
            "observations",
            "latest_prices",
        ],
        evidence_fields=[
            "status",
            "sourceRunId",
            "acceptedCount",
            "rawRecordCount",
            "observationCount",
            "productCount",
            "chainCount",
        ],
        evidence_artifacts=[
            "/tmp/groceryview-open-prices-import-result.json",
        ],
    )


def build_open_prices_hosted_smoke_plan(
    *,
    deployment_url_present: bool = False,
    deployment_url: str | None = None,
    metrics_token_present: bool = False,
    imported_terminal_product_id_present: bool = False,
) -> OpenPricesHostedSmokePlan:
    required_actions: list[str] = []
    normalized_deployment_url = "<https://api.example.com>"
    if deployment_url is not None:
        deployment_url_present = True
        normalized_url = _normalize_hosted_smoke_url(deployment_url)
        if normalized_url is None:
            required_actions.append("fix_groceryview_server_url")
        else:
            normalized_deployment_url = normalized_url

    if not deployment_url_present:
        required_actions.append("set_groceryview_server_url")
    if not metrics_token_present:
        required_actions.append("set_metrics_token")
    if not imported_terminal_product_id_present:
        required_actions.append("set_imported_terminal_product_id")

    return OpenPricesHostedSmokePlan(
        status="ready" if not required_actions else "blocked",
        source_asset="open_prices_artifact_import_plan",
        smoke_command=(
            f"GROCERYVIEW_SERVER_URL={normalized_deployment_url} "
            "GROCERYVIEW_TERMINAL_PRODUCT_ID=<imported-product-id> "
            "HOSTED_HTTP_SMOKE_OUTPUT_PATH=/tmp/groceryview-hosted-http-smoke.json "
            "infra/scripts/smoke-hosted-http.sh && "
            f"GROCERYVIEW_SERVER_URL={normalized_deployment_url} "
            "METRICS_TOKEN=<token> "
            "HOSTED_READINESS_SMOKE_OUTPUT_PATH=/tmp/groceryview-hosted-readiness-smoke.json "
            "infra/scripts/smoke-hosted-readiness.sh"
        ),
        required_env=[
            "GROCERYVIEW_SERVER_URL",
            "GROCERYVIEW_TERMINAL_PRODUCT_ID",
            "METRICS_TOKEN",
        ],
        required_actions=required_actions,
        endpoints=[
            "/api/health",
            "/api/products/{GROCERYVIEW_TERMINAL_PRODUCT_ID}/terminal",
            "/api/readiness/postgres",
        ],
        evidence_fields=[
            "apiHealthStatus",
            "terminalProductId",
            "terminalQuote",
            "terminalDistribution",
            "terminalChart",
            "postgresReadinessStatus",
        ],
        evidence_artifacts=[
            "/tmp/groceryview-hosted-http-smoke.json",
            "/tmp/groceryview-hosted-readiness-smoke.json",
        ],
    )


def build_open_prices_schedule_health_plan(
    *,
    dagster_deployment_url_present: bool = False,
    ingestion_schedule_enabled: bool = False,
    import_readiness_schedule_enabled: bool = False,
    schedule_health_probe_configured: bool = False,
) -> OpenPricesScheduleHealthPlan:
    required_actions: list[str] = []
    if not dagster_deployment_url_present:
        required_actions.append("configure_dagster_deployment_url")
    if not ingestion_schedule_enabled:
        required_actions.append("enable_open_prices_ingestion_schedule")
    if not import_readiness_schedule_enabled:
        required_actions.append("enable_open_prices_import_readiness_schedule")
    if not schedule_health_probe_configured:
        required_actions.append("publish_open_prices_schedule_health_probe")

    return OpenPricesScheduleHealthPlan(
        status="ready" if not required_actions else "blocked",
        source_assets=[
            "open_prices_ingestion_run_plan",
            "open_prices_launch_readiness_digest",
        ],
        schedule_names=[
            "open_prices_ingestion_schedule",
            "open_prices_import_readiness_schedule",
        ],
        required_env=[
            "DAGSTER_DEPLOYMENT_URL",
            "OPEN_PRICES_INGESTION_SCHEDULE_ENABLED",
            "OPEN_PRICES_IMPORT_READINESS_SCHEDULE_ENABLED",
            "OPEN_PRICES_SCHEDULE_HEALTH_MAX_AGE_HOURS",
        ],
        required_actions=required_actions,
        evidence_fields=[
            "scheduleName",
            "cronSchedule",
            "lastTickAt",
            "lastRunStatus",
            "lastRunAgeHours",
            "nextTickAt",
        ],
        evidence_artifacts=[
            "/tmp/groceryview-open-prices-schedule-health.json",
        ],
    )


def summarize_open_prices_ingestion_run_plan(plan: OpenPricesIngestionRunPlan) -> OpenPricesIngestionRunPlanSummary:
    return OpenPricesIngestionRunPlanSummary(
        status=plan.status,
        required_action_count=len(plan.required_actions),
        required_env_count=len(plan.required_env),
        materialization_asset_count=len(plan.materialization_assets),
        persistence_target_count=len(plan.persistence_targets),
        evidence_field_count=len(plan.evidence_fields),
        schedule_cron=plan.schedule_cron,
    )


def summarize_open_prices_artifact_import_plan(plan: OpenPricesArtifactImportPlan) -> OpenPricesArtifactImportPlanSummary:
    return OpenPricesArtifactImportPlanSummary(
        status=plan.status,
        required_action_count=len(plan.required_actions),
        required_env_count=len(plan.required_env),
        required_package_count=len(plan.required_packages),
        database_target_count=len(plan.database_targets),
        evidence_field_count=len(plan.evidence_fields),
        evidence_artifact_count=len(plan.evidence_artifacts),
    )


def summarize_open_prices_hosted_smoke_plan(plan: OpenPricesHostedSmokePlan) -> OpenPricesHostedSmokePlanSummary:
    return OpenPricesHostedSmokePlanSummary(
        status=plan.status,
        required_action_count=len(plan.required_actions),
        required_env_count=len(plan.required_env),
        endpoint_count=len(plan.endpoints),
        evidence_field_count=len(plan.evidence_fields),
        evidence_artifact_count=len(plan.evidence_artifacts),
    )


def summarize_open_prices_schedule_health_plan(plan: OpenPricesScheduleHealthPlan) -> OpenPricesScheduleHealthPlanSummary:
    return OpenPricesScheduleHealthPlanSummary(
        status=plan.status,
        required_action_count=len(plan.required_actions),
        required_env_count=len(plan.required_env),
        source_asset_count=len(plan.source_assets),
        schedule_count=len(plan.schedule_names),
        evidence_field_count=len(plan.evidence_fields),
        evidence_artifact_count=len(plan.evidence_artifacts),
    )


def build_open_prices_launch_readiness_summary(
    pull_plan: OpenPricesPullPlan,
    ingestion_plan: OpenPricesIngestionRunPlan,
    artifact_import_plan: OpenPricesArtifactImportPlan,
    hosted_smoke_plan: OpenPricesHostedSmokePlan | None = None,
    schedule_health_plan: OpenPricesScheduleHealthPlan | None = None,
) -> OpenPricesLaunchReadinessSummary:
    plans = {
        "open_prices_real_pull_plan": pull_plan,
        "open_prices_ingestion_run_plan": ingestion_plan,
        "open_prices_artifact_import_plan": artifact_import_plan,
    }
    if hosted_smoke_plan is not None:
        plans["open_prices_hosted_smoke_plan"] = hosted_smoke_plan
    if schedule_health_plan is not None:
        plans["open_prices_schedule_health_plan"] = schedule_health_plan
    blockers_by_plan = {
        plan_name: list(plan.required_actions)
        for plan_name, plan in plans.items()
        if plan.status != "ready"
    }
    next_actions = sorted({action for actions in blockers_by_plan.values() for action in actions})
    evidence_fields = sorted(
        {
            field
            for plan in plans.values()
            for field in plan.evidence_fields
        }
    )
    evidence_artifacts = sorted(
        {
            artifact
            for plan in plans.values()
            for artifact in getattr(plan, "evidence_artifacts", [])
        }
    )

    return OpenPricesLaunchReadinessSummary(
        status="ready" if not blockers_by_plan else "blocked",
        ready_plan_count=sum(1 for plan in plans.values() if plan.status == "ready"),
        blocked_plan_count=len(blockers_by_plan),
        checked_plans=list(plans.keys()),
        blockers_by_plan=blockers_by_plan,
        next_actions=next_actions,
        evidence_fields=evidence_fields,
        evidence_artifacts=evidence_artifacts,
    )


def summarize_open_prices_launch_readiness(
    summary: OpenPricesLaunchReadinessSummary,
) -> OpenPricesLaunchReadinessDigest:
    hosted_smoke_blockers = summary.blockers_by_plan.get("open_prices_hosted_smoke_plan", [])
    schedule_health_blockers = summary.blockers_by_plan.get("open_prices_schedule_health_plan", [])
    persistence_plan_names = {
        "open_prices_ingestion_run_plan",
        "open_prices_artifact_import_plan",
    }
    persistence_blocker_count = sum(
        len(blockers)
        for plan_name, blockers in summary.blockers_by_plan.items()
        if plan_name in persistence_plan_names
    )

    return OpenPricesLaunchReadinessDigest(
        status=summary.status,
        checked_plan_count=len(summary.checked_plans),
        ready_plan_count=summary.ready_plan_count,
        blocked_plan_count=summary.blocked_plan_count,
        next_action_count=len(summary.next_actions),
        evidence_field_count=len(summary.evidence_fields),
        evidence_artifact_count=len(summary.evidence_artifacts),
        hosted_smoke_blocker_count=len(hosted_smoke_blockers),
        persistence_blocker_count=persistence_blocker_count,
        schedule_health_blocker_count=len(schedule_health_blockers),
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


def build_data_pipeline_quality_gate(
    quality: QualityCheckSummary,
    freshness: ObservationFreshnessSummary,
    coverage: ObservationCoverageSummary,
    open_prices_ingestion: OpenPricesIngestionRunPlan | None = None,
    open_prices_import: OpenPricesArtifactImportPlan | None = None,
    open_prices_hosted_smoke: OpenPricesHostedSmokePlan | None = None,
    open_prices_schedule_health: OpenPricesScheduleHealthPlan | None = None,
    min_observations: int = 1,
) -> DataPipelineQualityGateSummary:
    blockers: list[str] = []

    if quality.observation_count < min_observations:
        blockers.append("observations_below_minimum")
    if quality.latest_rollup_count == 0:
        blockers.append("latest_rollup_empty")
    if quality.missing_provenance_count > 0:
        blockers.append("price_observation_provenance_missing")
    if quality.missing_fetch_stub_provenance_count > 0:
        blockers.append("fetch_stub_provenance_missing")
    if quality.duplicate_key_count > 0:
        blockers.append("duplicate_product_store_observations")
    if freshness.status == "blocked":
        blockers.append("price_observation_freshness_blocked")
    if coverage.status != "ready":
        blockers.append("price_observation_coverage_partial")
    if open_prices_ingestion is not None and open_prices_ingestion.status != "ready":
        blockers.append("open_prices_ingestion_plan_blocked")
    if open_prices_import is not None and open_prices_import.status != "ready":
        blockers.append("open_prices_artifact_import_plan_blocked")
    if open_prices_hosted_smoke is not None and open_prices_hosted_smoke.status != "ready":
        blockers.append("open_prices_hosted_smoke_plan_blocked")
    if open_prices_schedule_health is not None and open_prices_schedule_health.status != "ready":
        blockers.append("open_prices_schedule_health_plan_blocked")

    return DataPipelineQualityGateSummary(
        status="ready" if not blockers else "blocked",
        blockers=blockers,
        observation_count=quality.observation_count,
        latest_rollup_count=quality.latest_rollup_count,
        checked_assets=[
            "quality_checks",
            "price_observation_freshness",
            "price_observation_coverage",
            *([] if open_prices_ingestion is None else ["open_prices_ingestion_run_plan"]),
            *([] if open_prices_import is None else ["open_prices_artifact_import_plan"]),
            *([] if open_prices_hosted_smoke is None else ["open_prices_hosted_smoke_plan"]),
            *([] if open_prices_schedule_health is None else ["open_prices_schedule_health_plan"]),
        ],
    )


def summarize_data_pipeline_quality_gate(gate: DataPipelineQualityGateSummary) -> DataPipelineQualityGateDigest:
    return DataPipelineQualityGateDigest(
        status=gate.status,
        total_blockers=len(gate.blockers),
        provenance_blockers=sum(1 for blocker in gate.blockers if "provenance" in blocker),
        freshness_blockers=sum(1 for blocker in gate.blockers if "freshness" in blocker),
        coverage_blockers=sum(1 for blocker in gate.blockers if "coverage" in blocker),
        duplicate_blockers=sum(1 for blocker in gate.blockers if blocker.startswith("duplicate_")),
        volume_blockers=sum(1 for blocker in gate.blockers if blocker in {"observations_below_minimum", "latest_rollup_empty"}),
        ingestion_blockers=sum(1 for blocker in gate.blockers if blocker.startswith("open_prices_")),
        schedule_health_blockers=sum(
            1 for blocker in gate.blockers if blocker == "open_prices_schedule_health_plan_blocked"
        ),
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
def open_prices_ingestion_run_plan(open_prices_real_pull_plan: dict[str, object]) -> dict[str, object]:
    return build_open_prices_ingestion_run_plan(
        open_prices_user_agent_present=open_prices_real_pull_plan.get("status") == "ready",
        database_url_present=False,
        raw_snapshot_storage_present=False,
        schedule_enabled=False,
    ).to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_artifact_import_plan(open_prices_real_pull_plan: dict[str, object]) -> dict[str, object]:
    return build_open_prices_artifact_import_plan(
        database_url_present=False,
        input_artifact_present=open_prices_real_pull_plan.get("status") == "ready",
        db_package_built=False,
    ).to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_hosted_smoke_plan(open_prices_artifact_import_plan: dict[str, object]) -> dict[str, object]:
    return build_open_prices_hosted_smoke_plan(
        deployment_url_present=False,
        metrics_token_present=False,
        imported_terminal_product_id_present=open_prices_artifact_import_plan.get("status") == "ready",
    ).to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_schedule_health_plan() -> dict[str, object]:
    return build_open_prices_schedule_health_plan(
        dagster_deployment_url_present=False,
        ingestion_schedule_enabled=False,
        import_readiness_schedule_enabled=False,
        schedule_health_probe_configured=False,
    ).to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_launch_readiness(
    open_prices_real_pull_plan: dict[str, object],
    open_prices_ingestion_run_plan: dict[str, object],
    open_prices_artifact_import_plan: dict[str, object],
    open_prices_hosted_smoke_plan: dict[str, object],
    open_prices_schedule_health_plan: dict[str, object],
) -> dict[str, object]:
    summary = build_open_prices_launch_readiness_summary(
        OpenPricesPullPlan(**open_prices_real_pull_plan),
        OpenPricesIngestionRunPlan(**open_prices_ingestion_run_plan),
        OpenPricesArtifactImportPlan(**open_prices_artifact_import_plan),
        OpenPricesHostedSmokePlan(**open_prices_hosted_smoke_plan),
        OpenPricesScheduleHealthPlan(**open_prices_schedule_health_plan),
    )
    return summary.to_dict()


@asset(group_name=ASSET_GROUP)
def open_prices_launch_readiness_digest(open_prices_launch_readiness: dict[str, object]) -> dict[str, object]:
    blockers_by_plan = {
        str(plan_name): [str(action) for action in actions]
        for plan_name, actions in dict(open_prices_launch_readiness["blockers_by_plan"]).items()
    }
    summary = OpenPricesLaunchReadinessSummary(
        status=open_prices_launch_readiness["status"],
        ready_plan_count=int(open_prices_launch_readiness["ready_plan_count"]),
        blocked_plan_count=int(open_prices_launch_readiness["blocked_plan_count"]),
        checked_plans=[str(plan) for plan in open_prices_launch_readiness["checked_plans"]],
        blockers_by_plan=blockers_by_plan,
        next_actions=[str(action) for action in open_prices_launch_readiness["next_actions"]],
        evidence_fields=[str(field) for field in open_prices_launch_readiness["evidence_fields"]],
        evidence_artifacts=[str(artifact) for artifact in open_prices_launch_readiness["evidence_artifacts"]],
        demo=bool(open_prices_launch_readiness.get("demo", False)),
    )
    return summarize_open_prices_launch_readiness(summary).to_dict()


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


@asset(group_name=ASSET_GROUP)
def data_pipeline_quality_gate(
    quality_checks: dict[str, object],
    price_observation_freshness: dict[str, object],
    price_observation_coverage: dict[str, object],
    open_prices_ingestion_run_plan: dict[str, object],
    open_prices_artifact_import_plan: dict[str, object],
    open_prices_hosted_smoke_plan: dict[str, object],
    open_prices_schedule_health_plan: dict[str, object],
) -> dict[str, object]:
    quality = QualityCheckSummary(**quality_checks)
    freshness = ObservationFreshnessSummary(**price_observation_freshness)
    coverage = ObservationCoverageSummary(**price_observation_coverage)
    open_prices_ingestion = OpenPricesIngestionRunPlan(**open_prices_ingestion_run_plan)
    open_prices_import = OpenPricesArtifactImportPlan(**open_prices_artifact_import_plan)
    open_prices_hosted_smoke = OpenPricesHostedSmokePlan(**open_prices_hosted_smoke_plan)
    open_prices_schedule_health = OpenPricesScheduleHealthPlan(**open_prices_schedule_health_plan)
    summary = build_data_pipeline_quality_gate(
        quality,
        freshness,
        coverage,
        open_prices_ingestion,
        open_prices_import,
        open_prices_hosted_smoke,
        open_prices_schedule_health,
    )
    return summary.to_dict()
