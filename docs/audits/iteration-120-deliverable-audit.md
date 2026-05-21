# Iteration 120 Deliverable Audit — Daily Catalog Coverage Workflow Gate

## Objective restatement

Enforce all-products/all-stores catalog coverage in the scheduled daily ingestion workflow, so the daily run fails if deployed coverage readiness is incomplete after ingestion.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Daily ingestion still runs | Existing cron and `Run configured daily ingestion` step are unchanged. | Preserved |
| Database readiness still checked | Existing `/api/readiness/postgres` step is unchanged. | Preserved |
| Source-run freshness still checked | Existing `/api/readiness/source-runs` step is unchanged. | Preserved |
| Product-store catalog coverage checked every day | New workflow step calls `/api/readiness/catalog-coverage` with metrics token after source-run readiness. | Implemented |
| Incomplete product/store coverage fails closed | Workflow exits non-zero unless response status is `complete`, `missingProductStorePairs` is empty, and `requiredActions` is empty. | Implemented |
| Workflow contract test covers new gate | `tests/schema/daily-ingestion-workflow.test.mjs` now requires `/api/readiness/catalog-coverage`, `missingProductStorePairs`, and `requiredActions`. | Verified |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk node --test tests/schema/daily-ingestion-workflow.test.mjs` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- Production still needs `CATALOG_COVERAGE_TARGETS_JSON` configured on the server with the real target product/store universe.
- If current sources cannot satisfy all product-store pairs, the daily workflow will correctly fail closed until source coverage is widened or targets are adjusted with explicit evidence.
