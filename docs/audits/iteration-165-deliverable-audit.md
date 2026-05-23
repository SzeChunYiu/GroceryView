# Iteration 165 Deliverable Audit — Runtime OCR.space Receipt Provider

## Objective restatement

Continue turning GroceryView into a real product by replacing the provider-neutral receipt OCR seam with a concrete OCR.space runtime adapter, then PR and merge the round to `main`.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Concrete receipt OCR provider | `createOcrSpaceReceiptProvider()` in `packages/scanning/src/index.ts` posts private receipt payload references to OCR.space and normalizes parsed lines into `ScanReceiptOcrResult` rows | Implemented in this PR |
| Fail-closed provider configuration | `createOcrSpaceReceiptProvider()` rejects blank API keys and malformed/errored provider responses instead of silently producing review items without OCR evidence | Implemented in this PR |
| Runtime scan-provider wiring | `packages/server/src/index.ts` loads `OCR_SPACE_API_KEY`, requires it in production, and passes the configured OCR.space provider into `buildRuntimeAuthOptions()` scan providers | Implemented in this PR |
| Regression coverage | `packages/scanning/src/__tests__/pipeline.test.ts` covers OCR.space request shape, response normalization, and error handling; `packages/server/src/__tests__/runtimeConfig.test.ts` covers runtime config and provider injection | Implemented in this PR |
| Completion audit updated | `docs/status/completion-audit.md` records OCR.space provider progress while keeping live key, hosted proof, storage, and device evidence gaps explicit | Implemented in this PR |
| PR and merge to `main` | This branch/PR is the merge vehicle for the round | Pending until PR step |

## TDD evidence

- RED: `rtk npm run test -w @groceryview/scanning` failed because `createOcrSpaceReceiptProvider` was not exported before implementation.
- GREEN: `rtk npm run test -w @groceryview/scanning` passed after adding the OCR.space provider and tests.

## Verification

- Targeted verification before PR: `rtk node --test tests/schema/completion-audit.test.mjs && rtk npm run test -w @groceryview/scanning && rtk npm run test -w @groceryview/server`
- Full verification before PR: `rtk git diff --check && rtk npm run test -w @groceryview/scanning && rtk npm run test -w @groceryview/server && rtk npm test && rtk npm run build && rtk npm run typecheck`

## Remaining gaps

This adds a concrete OCR.space receipt provider adapter and runtime wiring, but GroceryView still needs a live OCR.space credential in production, observed hosted provider proof, object-storage credentials, hosted CORS/upload proof, barcode provider integration, device capture proof, and EAS store-build artifacts.
