# Iteration 121 Deliverable Audit — Required Production Coverage Targets

## Objective restatement

Make the production all-products/all-stores coverage target inventory an explicit required configuration item, so deployment cannot silently omit the target universe that the daily catalog coverage gate evaluates.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Production target inventory is required | `loadRuntimeConfig` now requires `CATALOG_COVERAGE_TARGETS_JSON` when `NODE_ENV=production`. | Implemented |
| Deploy manifest requires the variable | `deploy/groceryview.manifest.json` includes `CATALOG_COVERAGE_TARGETS_JSON` in server `requiredEnv`. | Implemented |
| Manifest test enforces it | `tests/schema/deploy.test.mjs` requires the new env var. | Verified |
| Local example documents the variable | `.env.example` includes example `CATALOG_COVERAGE_TARGETS_JSON`. | Implemented |
| Daily connector config is discoverable | `.env.example` includes example `GROCERYVIEW_DAILY_CONNECTORS_JSON` for the scheduled ingestion runner. | Implemented |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/server` | Pass: 54 tests |
| `rtk node --test tests/schema/deploy.test.mjs` | Pass |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- The repo now requires the production coverage target inventory, but the actual deployed secret value still needs to be populated with the real all-product/all-store universe.
- The example daily connector JSON is intentionally minimal; production still needs complete connector definitions for every required chain.
