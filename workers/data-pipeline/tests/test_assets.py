from groceryview_data_pipeline.assets import (
    build_data_pipeline_quality_gate,
    build_latest_price_rollup,
    build_normalized_products,
    build_observation_coverage_summary,
    build_observation_freshness_summary,
    build_open_prices_artifact_import_plan,
    build_open_prices_hosted_smoke_plan,
    build_open_prices_ingestion_run_plan,
    build_open_prices_launch_readiness_summary,
    build_open_prices_pull_plan,
    build_open_prices_schedule_health_plan,
    build_price_observation_mix_summary,
    build_price_observations,
    build_quality_checks,
    build_retailer_fetch_stubs,
    build_seed_products,
    build_seed_stores,
    summarize_open_prices_artifact_import_plan,
    summarize_data_pipeline_quality_gate,
    summarize_open_prices_launch_readiness,
    summarize_open_prices_hosted_smoke_plan,
    summarize_open_prices_ingestion_run_plan,
    summarize_open_prices_schedule_health_plan,
)
from groceryview_data_pipeline.models import LatestPriceRow, ObservationFreshnessSummary, PriceObservationRow, PriceProvenance


def test_data_pipeline_assets_cover_the_expected_lane_contract() -> None:
    stores = build_seed_stores()
    products = build_seed_products()
    stubs = build_retailer_fetch_stubs(stores, products)
    normalized_products = build_normalized_products(products)
    observations = build_price_observations(stubs, normalized_products)
    latest = build_latest_price_rollup(observations)
    quality = build_quality_checks(stubs, observations, latest)

    assert len(stores) >= 5
    assert len(products) >= 8
    assert len(stubs) > 0
    assert len(observations) == len(stubs)
    assert len(latest) <= len(observations)
    assert quality.observation_count == len(observations)
    assert quality.latest_rollup_count == len(latest)
    assert quality.missing_provenance_count == 0
    assert quality.fetch_stub_count == len(stubs)
    assert "retailer_page" in quality.source_types

    first_stub = stubs[0]
    assert first_stub.provenance.source_type == "retailer_page"
    assert first_stub.provenance.source_run_id.startswith("demo-run-")
    assert first_stub.provenance.raw_snapshot_ref and first_stub.provenance.raw_snapshot_ref.startswith("s3://")

    first_observation = observations[0]
    assert first_observation.provenance.observed_at == first_observation.observed_at
    assert first_observation.unit_price_amount is not None
    assert first_observation.price_type in {"regular", "promotion"}

    for row in observations:
        assert row.provenance.raw_snapshot_ref is not None
        assert row.provenance.raw_record_id

    for row in latest:
        assert row.provenance.raw_record_id.startswith("raw-")

    round_tripped = PriceProvenance(**first_stub.provenance.to_dict())
    assert round_tripped.parser_version == first_stub.provenance.parser_version


def test_open_prices_pull_plan_exposes_real_data_smoke_requirements() -> None:
    plan = build_open_prices_pull_plan()

    assert plan.status == "blocked"
    assert plan.source_type == "open_data"
    assert plan.parser_version == "open-prices-v1"
    assert plan.endpoint_url == "https://prices.openfoodfacts.org/api/v1/prices?currency=SEK&size=10&location__osm_address_country_code=SE&order_by=-date"
    assert plan.required_env == ["OPEN_PRICES_USER_AGENT"]
    assert plan.required_actions == ["set_open_prices_user_agent", "run_open_prices_smoke"]
    assert plan.smoke_command == "OPEN_PRICES_USER_AGENT=<app/version contact> infra/scripts/smoke-open-prices.sh"
    assert plan.evidence_fields == [
        "sourceUrl",
        "statusCode",
        "contentHash",
        "rawSnapshotRef",
        "acceptedCount",
        "firstProduct",
    ]
    assert plan.to_dict()["demo"] is False


def test_open_prices_ingestion_run_plan_blocks_until_persistence_and_schedule_are_configured() -> None:
    plan = build_open_prices_ingestion_run_plan(open_prices_user_agent_present=True)

    assert plan.status == "blocked"
    assert plan.source_asset == "open_prices_real_pull_plan"
    assert plan.schedule_cron == "17 */6 * * *"
    assert plan.freshness_sla_hours == 8
    assert plan.required_env == [
        "OPEN_PRICES_USER_AGENT",
        "DATABASE_URL",
        "GROCERYVIEW_RAW_SNAPSHOT_BUCKET",
        "OPEN_PRICES_SCHEDULE_ENABLED",
    ]
    assert plan.required_actions == [
        "set_database_url",
        "configure_raw_snapshot_storage",
        "enable_open_prices_schedule",
    ]
    assert plan.materialization_assets == [
        "open_prices_real_pull_plan",
        "price_observations",
        "latest_price_rollup",
        "price_observation_freshness",
        "price_observation_coverage",
    ]
    assert plan.persistence_targets == [
        "raw_snapshots",
        "source_runs",
        "raw_price_records",
        "price_observations",
        "latest_prices",
    ]
    assert plan.idempotency_key_fields == [
        "source_type",
        "source_url",
        "content_hash",
        "parser_version",
        "observed_at",
    ]
    assert plan.evidence_fields == [
        "runKey",
        "sourceUrl",
        "contentHash",
        "rawSnapshotRef",
        "acceptedCount",
        "persistedObservationCount",
        "latestRollupCount",
        "freshnessStatus",
    ]
    assert plan.to_dict()["demo"] is False

    ready = build_open_prices_ingestion_run_plan(
        open_prices_user_agent_present=True,
        database_url_present=True,
        raw_snapshot_storage_present=True,
        schedule_enabled=True,
    )
    assert ready.status == "ready"
    assert ready.required_actions == []


def test_open_prices_artifact_import_plan_exposes_database_import_contract() -> None:
    plan = build_open_prices_artifact_import_plan(input_artifact_present=True)

    assert plan.status == "blocked"
    assert plan.source_asset == "open_prices_real_pull_plan"
    assert plan.import_command == "npm run build --workspace @groceryview/db && DATABASE_URL=<postgres-url> OPEN_PRICES_INPUT_PATH=<artifact.json> infra/scripts/import-open-prices-artifact.sh"
    assert plan.required_env == ["DATABASE_URL", "OPEN_PRICES_INPUT_PATH"]
    assert plan.required_actions == ["set_database_url", "build_groceryview_db_package"]
    assert plan.required_packages == ["@groceryview/db", "pg"]
    assert plan.database_targets == [
        "source_runs",
        "raw_records",
        "products",
        "aliases",
        "observations",
        "latest_prices",
    ]
    assert plan.evidence_fields == [
        "status",
        "sourceRunId",
        "acceptedCount",
        "rawRecordCount",
        "observationCount",
        "productCount",
        "chainCount",
    ]
    assert plan.to_dict()["demo"] is False

    ready = build_open_prices_artifact_import_plan(
        database_url_present=True,
        input_artifact_present=True,
        db_package_built=True,
    )
    assert ready.status == "ready"
    assert ready.required_actions == []


def test_open_prices_hosted_smoke_plan_blocks_until_hosted_proof_is_configured() -> None:
    plan = build_open_prices_hosted_smoke_plan(imported_terminal_product_id_present=True)

    assert plan.status == "blocked"
    assert plan.source_asset == "open_prices_artifact_import_plan"
    assert plan.required_env == [
        "GROCERYVIEW_SERVER_URL",
        "GROCERYVIEW_TERMINAL_PRODUCT_ID",
        "METRICS_TOKEN",
    ]
    assert plan.required_actions == [
        "set_groceryview_server_url",
        "set_metrics_token",
    ]
    assert plan.endpoints == [
        "/api/health",
        "/api/products/{GROCERYVIEW_TERMINAL_PRODUCT_ID}/terminal",
        "/api/readiness/postgres",
    ]
    assert plan.evidence_fields == [
        "apiHealthStatus",
        "terminalProductId",
        "terminalQuote",
        "terminalDistribution",
        "terminalChart",
        "postgresReadinessStatus",
    ]
    assert "smoke-hosted-http.sh" in plan.smoke_command
    assert "smoke-hosted-readiness.sh" in plan.smoke_command
    assert plan.to_dict()["demo"] is False

    ready = build_open_prices_hosted_smoke_plan(
        deployment_url=" https://api.groceryview.example/ ",
        metrics_token_present=True,
        imported_terminal_product_id_present=True,
    )
    assert ready.status == "ready"
    assert ready.required_actions == []
    assert "GROCERYVIEW_SERVER_URL=https://api.groceryview.example " in ready.smoke_command

    invalid_url = build_open_prices_hosted_smoke_plan(
        deployment_url="groceryview.example",
        metrics_token_present=True,
        imported_terminal_product_id_present=True,
    )
    assert invalid_url.status == "blocked"
    assert invalid_url.required_actions == ["fix_groceryview_server_url"]


def test_open_prices_ingestion_run_plan_summary_counts_operator_requirements() -> None:
    blocked = build_open_prices_ingestion_run_plan(open_prices_user_agent_present=True)
    assert summarize_open_prices_ingestion_run_plan(blocked).to_dict() == {
        "status": "blocked",
        "required_action_count": 3,
        "required_env_count": 4,
        "materialization_asset_count": 5,
        "persistence_target_count": 5,
        "evidence_field_count": 8,
        "schedule_cron": "17 */6 * * *",
        "demo": False,
    }

    ready = build_open_prices_ingestion_run_plan(
        open_prices_user_agent_present=True,
        database_url_present=True,
        raw_snapshot_storage_present=True,
        schedule_enabled=True,
    )
    assert summarize_open_prices_ingestion_run_plan(ready).required_action_count == 0


def test_open_prices_artifact_import_plan_summary_counts_database_import_requirements() -> None:
    blocked = build_open_prices_artifact_import_plan(input_artifact_present=True)
    assert summarize_open_prices_artifact_import_plan(blocked).to_dict() == {
        "status": "blocked",
        "required_action_count": 2,
        "required_env_count": 2,
        "required_package_count": 2,
        "database_target_count": 6,
        "evidence_field_count": 7,
        "demo": False,
    }

    ready = build_open_prices_artifact_import_plan(
        database_url_present=True,
        input_artifact_present=True,
        db_package_built=True,
    )
    assert summarize_open_prices_artifact_import_plan(ready).required_action_count == 0


def test_open_prices_hosted_smoke_plan_summary_counts_hosted_evidence_requirements() -> None:
    blocked = build_open_prices_hosted_smoke_plan(imported_terminal_product_id_present=True)
    assert summarize_open_prices_hosted_smoke_plan(blocked).to_dict() == {
        "status": "blocked",
        "required_action_count": 2,
        "required_env_count": 3,
        "endpoint_count": 3,
        "evidence_field_count": 6,
        "demo": False,
    }

    ready = build_open_prices_hosted_smoke_plan(
        deployment_url_present=True,
        metrics_token_present=True,
        imported_terminal_product_id_present=True,
    )
    assert summarize_open_prices_hosted_smoke_plan(ready).required_action_count == 0


def test_open_prices_schedule_health_plan_blocks_until_worker_schedules_are_observable() -> None:
    plan = build_open_prices_schedule_health_plan(ingestion_schedule_enabled=True)

    assert plan.status == "blocked"
    assert plan.source_assets == [
        "open_prices_ingestion_run_plan",
        "open_prices_launch_readiness_digest",
    ]
    assert plan.schedule_names == [
        "open_prices_ingestion_schedule",
        "open_prices_import_readiness_schedule",
    ]
    assert plan.required_env == [
        "DAGSTER_DEPLOYMENT_URL",
        "OPEN_PRICES_INGESTION_SCHEDULE_ENABLED",
        "OPEN_PRICES_IMPORT_READINESS_SCHEDULE_ENABLED",
        "OPEN_PRICES_SCHEDULE_HEALTH_MAX_AGE_HOURS",
    ]
    assert plan.required_actions == [
        "configure_dagster_deployment_url",
        "enable_open_prices_import_readiness_schedule",
        "publish_open_prices_schedule_health_probe",
    ]
    assert plan.evidence_fields == [
        "scheduleName",
        "cronSchedule",
        "lastTickAt",
        "lastRunStatus",
        "lastRunAgeHours",
        "nextTickAt",
    ]
    assert plan.to_dict()["demo"] is False

    ready = build_open_prices_schedule_health_plan(
        dagster_deployment_url_present=True,
        ingestion_schedule_enabled=True,
        import_readiness_schedule_enabled=True,
        schedule_health_probe_configured=True,
    )
    assert ready.status == "ready"
    assert ready.required_actions == []


def test_open_prices_schedule_health_plan_summary_counts_schedule_requirements() -> None:
    blocked = build_open_prices_schedule_health_plan(ingestion_schedule_enabled=True)

    assert summarize_open_prices_schedule_health_plan(blocked).to_dict() == {
        "status": "blocked",
        "required_action_count": 3,
        "required_env_count": 4,
        "source_asset_count": 2,
        "schedule_count": 2,
        "evidence_field_count": 6,
        "demo": False,
    }

    ready = build_open_prices_schedule_health_plan(
        dagster_deployment_url_present=True,
        ingestion_schedule_enabled=True,
        import_readiness_schedule_enabled=True,
        schedule_health_probe_configured=True,
    )
    assert summarize_open_prices_schedule_health_plan(ready).required_action_count == 0


def test_open_prices_launch_readiness_rolls_up_all_open_prices_plans() -> None:
    pull = build_open_prices_pull_plan(open_prices_user_agent_present=True)
    ingestion = build_open_prices_ingestion_run_plan(open_prices_user_agent_present=True)
    artifact_import = build_open_prices_artifact_import_plan(input_artifact_present=True)
    hosted_smoke = build_open_prices_hosted_smoke_plan()

    summary = build_open_prices_launch_readiness_summary(pull, ingestion, artifact_import, hosted_smoke)

    assert summary.status == "blocked"
    assert summary.ready_plan_count == 1
    assert summary.blocked_plan_count == 3
    assert summary.checked_plans == [
        "open_prices_real_pull_plan",
        "open_prices_ingestion_run_plan",
        "open_prices_artifact_import_plan",
        "open_prices_hosted_smoke_plan",
    ]
    assert summary.blockers_by_plan == {
        "open_prices_ingestion_run_plan": [
            "set_database_url",
            "configure_raw_snapshot_storage",
            "enable_open_prices_schedule",
        ],
        "open_prices_artifact_import_plan": [
            "set_database_url",
            "build_groceryview_db_package",
        ],
        "open_prices_hosted_smoke_plan": [
            "set_groceryview_server_url",
            "set_metrics_token",
            "set_imported_terminal_product_id",
        ],
    }
    assert summary.next_actions == [
        "build_groceryview_db_package",
        "configure_raw_snapshot_storage",
        "enable_open_prices_schedule",
        "set_database_url",
        "set_groceryview_server_url",
        "set_imported_terminal_product_id",
        "set_metrics_token",
    ]
    assert "postgresReadinessStatus" in summary.evidence_fields
    assert "persistedObservationCount" in summary.evidence_fields
    assert "sourceRunId" in summary.evidence_fields
    assert summary.to_dict()["demo"] is False

    ready = build_open_prices_launch_readiness_summary(
        build_open_prices_pull_plan(open_prices_user_agent_present=True),
        build_open_prices_ingestion_run_plan(
            open_prices_user_agent_present=True,
            database_url_present=True,
            raw_snapshot_storage_present=True,
            schedule_enabled=True,
        ),
        build_open_prices_artifact_import_plan(
            database_url_present=True,
            input_artifact_present=True,
            db_package_built=True,
        ),
        build_open_prices_hosted_smoke_plan(
            deployment_url_present=True,
            metrics_token_present=True,
            imported_terminal_product_id_present=True,
        ),
    )
    assert ready.status == "ready"
    assert ready.blocked_plan_count == 0
    assert ready.next_actions == []


def test_open_prices_launch_readiness_digest_counts_operator_signals() -> None:
    summary = build_open_prices_launch_readiness_summary(
        build_open_prices_pull_plan(open_prices_user_agent_present=True),
        build_open_prices_ingestion_run_plan(open_prices_user_agent_present=True),
        build_open_prices_artifact_import_plan(input_artifact_present=True),
        build_open_prices_hosted_smoke_plan(),
    )

    assert summarize_open_prices_launch_readiness(summary).to_dict() == {
        "status": "blocked",
        "checked_plan_count": 4,
        "ready_plan_count": 1,
        "blocked_plan_count": 3,
        "next_action_count": 7,
        "evidence_field_count": 22,
        "hosted_smoke_blocker_count": 3,
        "persistence_blocker_count": 5,
        "demo": False,
    }

    ready_summary = build_open_prices_launch_readiness_summary(
        build_open_prices_pull_plan(open_prices_user_agent_present=True),
        build_open_prices_ingestion_run_plan(
            open_prices_user_agent_present=True,
            database_url_present=True,
            raw_snapshot_storage_present=True,
            schedule_enabled=True,
        ),
        build_open_prices_artifact_import_plan(
            database_url_present=True,
            input_artifact_present=True,
            db_package_built=True,
        ),
        build_open_prices_hosted_smoke_plan(
            deployment_url_present=True,
            metrics_token_present=True,
            imported_terminal_product_id_present=True,
        ),
    )
    ready_digest = summarize_open_prices_launch_readiness(ready_summary)
    assert ready_digest.status == "ready"
    assert ready_digest.next_action_count == 0
    assert ready_digest.hosted_smoke_blocker_count == 0
    assert ready_digest.persistence_blocker_count == 0


def test_latest_price_rollup_picks_latest_observation() -> None:
    product_slug = build_seed_products()[0].slug
    store_slug = build_seed_stores()[0].slug

    older_observation = PriceObservationRow(
        product_slug=product_slug,
        store_slug=store_slug,
        price_amount=10.0,
        unit="package",
        unit_price_amount=10.0,
        unit_price_unit="package",
        price_type="regular",
        observed_at="2026-05-19T11:00:00+00:00",
        source_type="retailer_page",
        confidence=0.7,
        confidence_label="medium",
        provenance=PriceProvenance(
            source_type="retailer_page",
            source_name="Demo source",
            source_url="https://example.com",
            source_run_id="run-1",
            raw_record_id="raw-1",
            raw_snapshot_ref="s3://groceryview-raw/run-1.json",
            fetched_at="2026-05-19T11:00:00+00:00",
            observed_at="2026-05-19T11:00:00+00:00",
            parser_version="demo-v1",
        ),
        member_only=False,
        promotion_label=None,
        valid_from=None,
        valid_to=None,
        demo=True,
    )
    newer_observation = PriceObservationRow(
        product_slug=product_slug,
        store_slug=store_slug,
        price_amount=9.0,
        unit="package",
        unit_price_amount=9.0,
        unit_price_unit="package",
        price_type="promotion",
        observed_at="2026-05-19T12:00:00+00:00",
        source_type="retailer_page",
        confidence=0.95,
        confidence_label="high",
        provenance=PriceProvenance(
            source_type="retailer_page",
            source_name="Demo source",
            source_url="https://example.com",
            source_run_id="run-2",
            raw_record_id="raw-2",
            raw_snapshot_ref="s3://groceryview-raw/run-2.json",
            fetched_at="2026-05-19T12:00:00+00:00",
            observed_at="2026-05-19T12:00:00+00:00",
            parser_version="demo-v1",
        ),
        member_only=False,
        promotion_label=None,
        valid_from=None,
        valid_to=None,
        demo=True,
    )

    rolled = build_latest_price_rollup([older_observation, newer_observation])
    assert len(rolled) == 1
    rolled_row = rolled[0]
    assert isinstance(rolled_row, LatestPriceRow)
    assert rolled_row.price_amount == 9.0
    assert rolled_row.price_type == "promotion"


def test_observation_freshness_summary_blocks_stale_future_and_missing_observations() -> None:
    product_slug = build_seed_products()[0].slug
    store_slug = build_seed_stores()[0].slug
    provenance = PriceProvenance(
        source_type="retailer_page",
        source_name="Demo source",
        source_url="https://example.com",
        source_run_id="run-freshness",
        raw_record_id="raw-freshness",
        raw_snapshot_ref="s3://groceryview-raw/run-freshness.json",
        fetched_at="2026-05-20T12:00:00+00:00",
        observed_at="2026-05-20T12:00:00+00:00",
        parser_version="demo-v1",
    )

    def row(observed_at: str) -> PriceObservationRow:
        return PriceObservationRow(
            product_slug=product_slug,
            store_slug=store_slug,
            price_amount=10.0,
            unit="package",
            unit_price_amount=10.0,
            unit_price_unit="package",
            price_type="regular",
            observed_at=observed_at,
            source_type="retailer_page",
            confidence=0.9,
            confidence_label="high",
            provenance=provenance,
            member_only=False,
            promotion_label=None,
            valid_from=None,
            valid_to=None,
            demo=True,
        )

    summary = build_observation_freshness_summary(
        [
            row("2026-05-20T11:00:00+00:00"),
            row("2026-05-18T11:59:59+00:00"),
            row("2026-05-20T13:00:00+00:00"),
            row("not-a-date"),
        ],
        checked_at="2026-05-20T12:00:00+00:00",
        max_age_hours=48,
    )

    assert summary.to_dict() == {
        "status": "blocked",
        "observation_count": 4,
        "fresh_count": 1,
        "stale_count": 1,
        "future_count": 1,
        "missing_observed_at_count": 1,
        "max_age_hours": 48,
        "checked_at": "2026-05-20T12:00:00+00:00",
        "demo": True,
    }


def test_observation_coverage_summary_reports_seeded_store_and_product_gaps() -> None:
    stores = build_seed_stores()
    products = build_seed_products()
    stubs = build_retailer_fetch_stubs(stores, products)
    normalized_products = build_normalized_products(products)
    observations = build_price_observations(stubs, normalized_products)

    full_summary = build_observation_coverage_summary(observations, stores, products)
    assert full_summary.to_dict() == {
        "status": "ready",
        "observation_count": len(observations),
        "store_count": len(stores),
        "covered_store_count": len(stores),
        "missing_store_count": 0,
        "product_count": len(products),
        "covered_product_count": len(products),
        "missing_product_count": 0,
        "demo": True,
    }

    partial_summary = build_observation_coverage_summary(
        [
            observation
            for observation in observations
            if observation.store_slug != stores[0].slug and observation.product_slug != products[0].slug
        ],
        stores,
        products,
    )

    assert partial_summary.status == "partial"
    assert partial_summary.missing_store_count == 1
    assert partial_summary.missing_product_count == 1


def test_price_observation_mix_summary_counts_price_evidence_breakdowns() -> None:
    stores = build_seed_stores()
    products = build_seed_products()
    stubs = build_retailer_fetch_stubs(stores, products)
    normalized_products = build_normalized_products(products)
    observations = build_price_observations(stubs, normalized_products)

    summary = build_price_observation_mix_summary(observations)

    assert summary.observation_count == len(observations)
    assert summary.source_types == {"retailer_page": len(observations)}
    assert summary.price_types["member"] == sum(1 for observation in observations if observation.price_type == "member")
    assert summary.price_types["promotion"] == summary.promotion_count
    assert summary.confidence_labels["verified"] >= 1
    assert summary.member_only_count == sum(1 for observation in observations if observation.member_only)


def test_data_pipeline_quality_gate_combines_quality_freshness_and_coverage_checks() -> None:
    stores = build_seed_stores()
    products = build_seed_products()
    stubs = build_retailer_fetch_stubs(stores, products)
    normalized_products = build_normalized_products(products)
    observations = build_price_observations(stubs, normalized_products)
    latest = build_latest_price_rollup(observations)
    quality = build_quality_checks(stubs, observations, latest)
    freshness = build_observation_freshness_summary(observations, checked_at="2026-05-19T10:00:00+00:00", max_age_hours=48)
    coverage = build_observation_coverage_summary(observations, stores, products)

    ready_ingestion = build_open_prices_ingestion_run_plan(
        open_prices_user_agent_present=True,
        database_url_present=True,
        raw_snapshot_storage_present=True,
        schedule_enabled=True,
    )
    ready_import = build_open_prices_artifact_import_plan(
        database_url_present=True,
        input_artifact_present=True,
        db_package_built=True,
    )
    ready_hosted_smoke = build_open_prices_hosted_smoke_plan(
        deployment_url_present=True,
        metrics_token_present=True,
        imported_terminal_product_id_present=True,
    )
    ready_gate = build_data_pipeline_quality_gate(
        quality,
        freshness,
        coverage,
        ready_ingestion,
        ready_import,
        ready_hosted_smoke,
    )
    assert ready_gate.to_dict() == {
        "status": "ready",
        "blockers": [],
        "observation_count": len(observations),
        "latest_rollup_count": len(latest),
        "checked_assets": [
            "quality_checks",
            "price_observation_freshness",
            "price_observation_coverage",
            "open_prices_ingestion_run_plan",
            "open_prices_artifact_import_plan",
            "open_prices_hosted_smoke_plan",
        ],
        "demo": True,
    }

    stale_freshness = ObservationFreshnessSummary(
        status="blocked",
        observation_count=len(observations),
        fresh_count=0,
        stale_count=len(observations),
        future_count=0,
        missing_observed_at_count=0,
        max_age_hours=1,
        checked_at="2026-05-20T10:00:00+00:00",
    )
    blocked_gate = build_data_pipeline_quality_gate(quality, stale_freshness, coverage)
    assert blocked_gate.status == "blocked"
    assert blocked_gate.blockers == ["price_observation_freshness_blocked"]

    blocked_ingestion = build_open_prices_ingestion_run_plan(open_prices_user_agent_present=True)
    blocked_open_prices_gate = build_data_pipeline_quality_gate(quality, freshness, coverage, blocked_ingestion)
    assert blocked_open_prices_gate.status == "blocked"
    assert blocked_open_prices_gate.blockers == ["open_prices_ingestion_plan_blocked"]
    assert blocked_open_prices_gate.checked_assets[-1] == "open_prices_ingestion_run_plan"

    blocked_import = build_open_prices_artifact_import_plan(input_artifact_present=True)
    blocked_import_gate = build_data_pipeline_quality_gate(quality, freshness, coverage, ready_ingestion, blocked_import)
    assert blocked_import_gate.status == "blocked"
    assert blocked_import_gate.blockers == ["open_prices_artifact_import_plan_blocked"]
    assert blocked_import_gate.checked_assets[-1] == "open_prices_artifact_import_plan"

    blocked_hosted_smoke = build_open_prices_hosted_smoke_plan(imported_terminal_product_id_present=True)
    blocked_hosted_gate = build_data_pipeline_quality_gate(
        quality,
        freshness,
        coverage,
        ready_ingestion,
        ready_import,
        blocked_hosted_smoke,
    )
    assert blocked_hosted_gate.status == "blocked"
    assert blocked_hosted_gate.blockers == ["open_prices_hosted_smoke_plan_blocked"]
    assert blocked_hosted_gate.checked_assets[-1] == "open_prices_hosted_smoke_plan"


def test_data_pipeline_quality_gate_digest_counts_blocker_classes() -> None:
    gate = build_data_pipeline_quality_gate(
        quality=build_quality_checks([], [], []),
        freshness=ObservationFreshnessSummary(
            status="blocked",
            observation_count=0,
            fresh_count=0,
            stale_count=0,
            future_count=0,
            missing_observed_at_count=0,
            max_age_hours=48,
            checked_at="2026-05-20T10:00:00+00:00",
        ),
        coverage=build_observation_coverage_summary([], build_seed_stores(), build_seed_products()),
    )

    assert summarize_data_pipeline_quality_gate(gate).to_dict() == {
        "status": "blocked",
        "total_blockers": 4,
        "provenance_blockers": 0,
        "freshness_blockers": 1,
        "coverage_blockers": 1,
        "duplicate_blockers": 0,
        "volume_blockers": 2,
        "ingestion_blockers": 0,
        "demo": True,
    }
