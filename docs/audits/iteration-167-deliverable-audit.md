# Iteration 167 Deliverable Audit — Scan Provider Readiness Endpoint

## Objective restatement

Continue turning GroceryView into a real product by exposing scanner provider readiness as a production-verifiable, token-protected endpoint, then PR and merge the round to `main`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Token-protected scan provider readiness | `/api/readiness/scanning` in `packages/server/src/index.ts` requires the metrics token and returns scan provider readiness evidence with `200` only for `status: ready` | Implemented in this PR |
| Fail-closed readiness behavior | Missing token/provider, blocked readiness reports, and thrown provider errors return `503`/`401` without leaking provider secrets | Implemented in this PR |
| Runtime readiness report | `buildRuntimeScanProviderReadinessReport()` maps runtime `OPENFOODFACTS_USER_AGENT` and `OCR_SPACE_API_KEY` config into barcode/OCR provider readiness evidence while keeping health `not_run` until explicit live proof exists | Implemented in this PR |
| OpenAPI coverage | `buildOpenApiDocument()` now documents `/api/readiness/scanning` with metrics-token security | Implemented in this PR |
| Hosted smoke coverage | `infra/scripts/smoke-hosted-readiness.sh` checks both PostgreSQL and scan-provider readiness and writes both endpoints into the hosted evidence artifact | Implemented in this PR |
| Regression coverage | `packages/server/src/__tests__/postgres-readiness.test.ts`, `packages/server/src/__tests__/openapi.test.ts`, and `tests/schema/hosted-smoke-workflow.test.mjs` cover the endpoint, OpenAPI route, and hosted smoke integration | Implemented in this PR |
| Completion audit updated | `docs/status/completion-audit.md` records scan readiness progress while keeping production health-proof, storage, OCR credential, and device evidence gaps explicit | Implemented in this PR |
| PR and merge to `main` | This branch/PR is the merge vehicle for the round | Pending until PR step |

## TDD evidence

- RED: `rtk npm run test -w @groceryview/server -- --test-name-pattern "scan provider readiness endpoint|buildOpenApiDocument"` failed because `scanProviderReadinessProvider` and `/api/readiness/scanning` did not exist.
- GREEN: the same command passed after adding the endpoint, runtime readiness report, OpenAPI route, and tests.

## Verification

- Targeted verification before PR: `rtk node --test tests/schema/hosted-smoke-workflow.test.mjs && rtk npm run test -w @groceryview/server -- --test-name-pattern "scan provider readiness endpoint|buildOpenApiDocument"`
- Full verification before PR: `rtk git diff --check && rtk node --test tests/schema/hosted-smoke-workflow.test.mjs tests/schema/completion-audit.test.mjs && rtk npm run test -w @groceryview/server && rtk npm test && rtk npm run build && rtk npm run typecheck`

## Remaining gaps

This exposes fail-closed scan-provider readiness and hosted smoke coverage, but GroceryView still needs production OCR.space credentials, live barcode/OCR health checks that can return ready, object-storage credentials, hosted CORS/upload proof, device capture proof, and EAS store-build artifacts.
