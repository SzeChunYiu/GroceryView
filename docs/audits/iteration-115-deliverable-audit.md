# Iteration 115 Deliverable Audit — Daily Source-Run Coverage Gate

## Objective restatement

Strengthen daily ingestion readiness so the system does not treat a fresh source run as enough by itself. A daily chain run must also prove that it accepted at least the configured minimum number of product rows before the deployed source-run readiness endpoint can pass.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Ingest data every day | Previous daily runner remains scheduled in `.github/workflows/daily-ingestion.yml`; this round hardens the readiness gate it must pass after running. | Preserved |
| All chains are checked | `packages/server/src/index.ts` still requires fresh daily runs for `ica`, `willys`, `coop`, `hemkop`, `lidl`, and `city_gross`. | Preserved |
| Fresh but empty runs fail closed | `SourceRunHealthInput.requiredAcceptedCountByChain` and `source_run_insufficient_accepted_rows:<chain>:<count>/<min>` block fresh successful runs whose provenance has too few accepted product rows. | Implemented |
| Operator dashboard summary exposes blocker type | `SourceRunHealthSummary.blockers.insufficientAcceptedRows` counts insufficient-row blockers separately from stale, failed, partial, and missing-chain blockers. | Implemented |
| Deployed readiness uses product-row minimums | Runtime source-run readiness now passes minimum accepted-row requirements of `1` for every required chain. | Implemented |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/db` | Pass: 98 tests |
| `rtk npm run test -w @groceryview/server` | Pass: 49 tests |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- Minimum accepted rows prevent empty fake-success runs, but they are not full product-universe or branch-universe completeness proof.
- Future coverage gates should compare accepted rows to store counts, chain SKU targets, and per-branch expected coverage once those source-specific inventories are available.
