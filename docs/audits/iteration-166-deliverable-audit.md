# Iteration 166 Deliverable Audit — Runtime OpenFoodFacts Barcode Provider

## Objective restatement

Continue turning GroceryView into a real product by replacing the provider-neutral barcode scan seam with a concrete OpenFoodFacts barcode lookup adapter, then PR and merge the round to `main`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Concrete barcode lookup provider | `createOpenFoodFactsBarcodeProvider()` in `packages/scanning/src/index.ts` calls the OpenFoodFacts product API with a declared user agent and normalizes successful barcode responses into `BarcodeLookup` results | Implemented in this PR |
| Fail-closed provider configuration | `createOpenFoodFactsBarcodeProvider()` rejects blank `OPENFOODFACTS_USER_AGENT`, invalid barcode payloads, HTTP failures, and unresolved provider responses | Implemented in this PR |
| Runtime scan-provider wiring | `packages/server/src/index.ts` loads `OPENFOODFACTS_USER_AGENT`, requires it in production, and passes the configured barcode provider into `buildRuntimeAuthOptions()` scan providers alongside OCR.space when configured | Implemented in this PR |
| Ops config alignment | `.env.example`, `scripts/ops/check-production-secrets.mjs`, and `scripts/ops/validate-production-env.mjs` include `OCR_SPACE_API_KEY` and `OPENFOODFACTS_USER_AGENT` so production readiness gates match the runtime scanner requirements | Implemented in this PR |
| Regression coverage | `packages/scanning/src/__tests__/pipeline.test.ts`, `packages/server/src/__tests__/runtimeConfig.test.ts`, `tests/schema/production-secrets-script.test.mjs`, and `tests/schema/production-env-validation-script.test.mjs` cover barcode provider behavior and runtime/ops config alignment | Implemented in this PR |
| Completion audit updated | `docs/status/completion-audit.md` records barcode provider progress while keeping live OCR credential, hosted provider proof, storage, and device evidence gaps explicit | Implemented in this PR |
| PR and merge to `main` | This branch/PR is the merge vehicle for the round | Pending until PR step |

## TDD evidence

- RED: `rtk npm run test -w @groceryview/scanning` failed because `createOpenFoodFactsBarcodeProvider` was not exported before implementation.
- GREEN: `rtk npm run test -w @groceryview/scanning` passed after adding the OpenFoodFacts barcode provider and tests.

## Verification

- Targeted verification before PR: `rtk node --test tests/schema/production-secrets-script.test.mjs tests/schema/production-env-validation-script.test.mjs tests/schema/completion-audit.test.mjs && rtk npm run test -w @groceryview/scanning && rtk npm run test -w @groceryview/server`
- Full verification before PR: `rtk git diff --check && rtk node --test tests/schema/production-secrets-script.test.mjs tests/schema/production-env-validation-script.test.mjs tests/schema/completion-audit.test.mjs && rtk npm run test -w @groceryview/scanning && rtk npm run test -w @groceryview/server && rtk npm test && rtk npm run build && rtk npm run typecheck`

## Remaining gaps

This adds a concrete OpenFoodFacts barcode provider adapter and runtime wiring, but GroceryView still needs a live OCR.space credential in production, observed hosted barcode/OCR provider proof, object-storage credentials, hosted CORS/upload proof, device capture proof, and EAS store-build artifacts.
