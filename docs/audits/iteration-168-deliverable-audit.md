# Iteration 168 Deliverable Audit — Live Scan Provider Health Checks

## Objective restatement

Continue turning GroceryView into a real product by making scan-provider readiness depend on live provider probes instead of static configuration only, then PR and merge the round to `main`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Barcode provider live probe | `buildRuntimeScanProviderReadinessReport()` calls the configured OpenFoodFacts barcode provider against `OPENFOODFACTS_HEALTHCHECK_BARCODE` before reporting `scan_provider_health_pass:barcode` | Implemented in this PR |
| Receipt OCR provider live probe | `buildRuntimeScanProviderReadinessReport()` calls the configured OCR.space provider against `OCR_SPACE_HEALTHCHECK_IMAGE_URL` before reporting `scan_provider_health_pass:receiptOcr` | Implemented in this PR |
| Fail-closed missing probe config | `/api/readiness/scanning` keeps `scan_provider_health_not_run:*` blockers when provider credentials exist but healthcheck payloads are absent | Implemented in this PR |
| Production config requirements | `loadRuntimeConfig()` requires `OCR_SPACE_HEALTHCHECK_IMAGE_URL` and `OPENFOODFACTS_HEALTHCHECK_BARCODE` in production and stores them in `RuntimeConfig` | Implemented in this PR |
| Ops config alignment | `.env.example`, `scripts/ops/check-production-secrets.mjs`, `scripts/ops/validate-production-env.mjs`, and schema tests include the scan healthcheck variables while preserving the daily-ingestion-only env scope | Implemented in this PR |
| Regression coverage | `packages/server/src/__tests__/runtimeConfig.test.ts`, `tests/schema/production-env-validation-script.test.mjs`, and `tests/schema/production-secrets-script.test.mjs` cover ready and blocked runtime scan readiness plus config alignment | Implemented in this PR |
| Completion audit updated | `docs/status/completion-audit.md` records live healthcheck progress while keeping hosted proof, storage, OCR credential, and device evidence gaps explicit | Implemented in this PR |
| PR and merge to `main` | This branch/PR is the merge vehicle for the round | Pending until PR step |

## TDD evidence

- RED: `rtk npm run test -w @groceryview/server -- --test-name-pattern "runtime scan provider health|runtime config"` failed because runtime config did not expose healthcheck values and `/api/readiness/scanning` returned `503` instead of `200` for successful provider probes.
- GREEN: the same command passed after adding healthcheck env parsing, live provider probe execution, and fail-closed readiness behavior.

## Verification

- Targeted verification before PR: `rtk npm run test -w @groceryview/server -- --test-name-pattern "runtime scan provider health|runtime config" && rtk node --test tests/schema/production-env-validation-script.test.mjs tests/schema/production-secrets-script.test.mjs tests/schema/completion-audit.test.mjs`
- Full verification before PR: `rtk git diff --check && rtk npm run test -w @groceryview/server && rtk node --test tests/schema/production-env-validation-script.test.mjs tests/schema/production-secrets-script.test.mjs tests/schema/completion-audit.test.mjs && rtk npm test && rtk npm run build && rtk npm run typecheck`

## Remaining gaps

This makes scanner readiness depend on live provider probes, but GroceryView still needs the production OCR.space credential and healthcheck payload populated in the hosted environment, observed hosted `/api/readiness/scanning` evidence, object-storage credentials, hosted CORS/upload proof, device capture proof, and EAS store-build artifacts.
