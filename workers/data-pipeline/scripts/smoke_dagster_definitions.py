from __future__ import annotations

import sys

EXPECTED_ASSETS = {
    "data_pipeline_quality_gate",
    "latest_price_rollup",
    "normalized_products",
    "open_prices_artifact_import_plan",
    "open_prices_hosted_smoke_plan",
    "open_prices_ingestion_run_plan",
    "open_prices_launch_readiness",
    "open_prices_real_pull_plan",
    "price_observation_coverage",
    "price_observation_freshness",
    "price_observation_mix",
    "price_observations",
    "quality_checks",
    "retailer_fetch_stubs",
    "seed_products",
    "seed_stores",
}

EXPECTED_SCHEDULES = {
    "open_prices_import_readiness_schedule",
    "open_prices_ingestion_schedule",
}


def asset_names() -> set[str]:
    try:
        from groceryview_data_pipeline.definitions import defs
    except ModuleNotFoundError as exc:
        if exc.name == "dagster":
            raise RuntimeError(
                "Dagster is not installed. Run `pip install -e .[dev]` from "
                "workers/data-pipeline before this smoke check."
            ) from exc
        raise

    if hasattr(defs, "resolve_asset_graph"):
        asset_graph = defs.resolve_asset_graph()
    else:
        asset_graph = defs.get_asset_graph()

    return {key.to_user_string() for key in asset_graph.get_all_asset_keys()}


def schedule_names() -> set[str]:
    try:
        from groceryview_data_pipeline.definitions import defs
    except ModuleNotFoundError as exc:
        if exc.name == "dagster":
            raise RuntimeError(
                "Dagster is not installed. Run `pip install -e .[dev]` from "
                "workers/data-pipeline before this smoke check."
            ) from exc
        raise

    return {schedule.name for schedule in defs.get_all_schedule_defs()}


def main() -> int:
    names = asset_names()
    schedules = schedule_names()
    missing = sorted(EXPECTED_ASSETS - names)
    unexpected = sorted(names - EXPECTED_ASSETS)
    missing_schedules = sorted(EXPECTED_SCHEDULES - schedules)
    unexpected_schedules = sorted(schedules - EXPECTED_SCHEDULES)

    if missing or unexpected or missing_schedules or unexpected_schedules:
        if missing:
            print(f"Missing assets: {', '.join(missing)}", file=sys.stderr)
        if unexpected:
            print(f"Unexpected assets: {', '.join(unexpected)}", file=sys.stderr)
        if missing_schedules:
            print(f"Missing schedules: {', '.join(missing_schedules)}", file=sys.stderr)
        if unexpected_schedules:
            print(f"Unexpected schedules: {', '.join(unexpected_schedules)}", file=sys.stderr)
        return 1

    print("Dagster definitions loaded.")
    print("Assets:")
    for name in sorted(names):
        print(f"- {name}")
    print("Schedules:")
    for name in sorted(schedules):
        print(f"- {name}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
