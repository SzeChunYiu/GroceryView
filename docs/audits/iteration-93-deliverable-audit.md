# Iteration 93 Deliverable Audit — Open Prices Data-Pipeline Visibility

## Objective restatement

Continue turning the new Open Prices real-data pull into an operationally visible path. The prior iteration proved GroceryView can pull and normalize real public SEK price rows; this iteration exposes that pull in the data-worker lane so operators can see the endpoint, required User-Agent, parser, smoke command, and evidence fields without reading shell-script internals.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Show the real-data pull in the data pipeline | `open_prices_real_pull_plan` Dagster asset is registered in `workers/data-pipeline/groceryview_data_pipeline/definitions.py` | Implemented |
| Keep source access requirements explicit | `build_open_prices_pull_plan()` returns blocked by default until `OPEN_PRICES_USER_AGENT` is set | Implemented |
| Link the worker lane to the live smoke | The plan asset exposes `OPEN_PRICES_USER_AGENT=<app/version contact> infra/scripts/smoke-open-prices.sh` | Implemented |
| Preserve evidence expectations | The plan lists required evidence fields: source URL, status code, content hash, raw snapshot reference, accepted count, and first product | Implemented |
| Keep Dagster smoke contracts aligned | `scripts/smoke_dagster_definitions.py` and `tests/test_dagster_smoke.py` include `open_prices_real_pull_plan` | Implemented |
| Document operator-facing asset | `workers/data-pipeline/README.md` lists the Open Prices pull-plan asset and what it exposes | Implemented |
| PR and merge to `main` | This branch/PR is the merge vehicle for this audit | Pending until merge step |

## Verification plan

| Command | Expected result |
| --- | --- |
| `rtk python3 -m pytest workers/data-pipeline/tests` | Worker asset and Dagster smoke contract tests pass |
| `rtk npm test` | Full workspace tests pass |
| `rtk npm run build` | Full workspace build passes |
| `rtk npm run typecheck` | Typecheck passes |
| `rtk git diff --check` | Whitespace check passes |

## Remaining gaps after this iteration

- The worker lane now exposes the real-data pull plan, but it still does not schedule, persist, or materialize Open Prices rows into PostgreSQL.
- Retailer-specific Stockholm/live provider connectors, legal approvals, and hosted worker proof remain separate blockers.
