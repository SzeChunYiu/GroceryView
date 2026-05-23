# Iteration 188 Deliverable Audit

## Scope

Close the production smoke gap where hosted/deploy readiness evidence checked PostgreSQL and scanner prerequisites but did not fail closed on the daily ingestion source-run or catalog coverage gates required for launch readiness.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Hosted readiness smoke covers daily ingestion source runs | `infra/scripts/smoke-hosted-readiness.sh` now calls `/api/readiness/source-runs` and requires a ready/complete response before it exits successfully. | Implemented |
| Hosted readiness smoke covers catalog coverage | `infra/scripts/smoke-hosted-readiness.sh` now calls `/api/readiness/catalog-coverage` and records the endpoint in optional JSON evidence. | Implemented |
| Scheduled and deploy smoke gates inherit the stricter check | `.github/workflows/hosted-smoke.yml` and `.github/workflows/deploy.yml` both continue to run the shared readiness smoke script, so the new endpoints gate both scheduled production smoke and post-deploy verification. | Implemented |
| Regression coverage protects the endpoint list | `tests/schema/hosted-smoke-workflow.test.mjs` asserts the shared readiness smoke script includes PostgreSQL, source-run, catalog-coverage, scanning, scan-upload-CORS, scan-upload-storage, and scan-upload-write endpoints. | Implemented |

## Remaining production blockers

- The hosted endpoints must pass against live production secrets, a migrated writable database, fresh daily source runs, and complete catalog coverage evidence.
- This only strengthens the smoke gate; it does not itself populate production data or secrets.
