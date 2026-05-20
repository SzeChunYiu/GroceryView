# Iteration 81 Deliverable Audit — Scan Upload Storage Bridge

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the scanner upload gap by adding a provider-neutral private upload-ticket contract before scan processing, while failing closed when no storage provider is configured.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature from remaining blockers | `docs/status/completion-audit.md` still listed durable scan upload storage as part of the barcode/receipt scanner gap after PR #325 | Selected scan upload storage bridge |
| Add failing tests before implementation | Scanning, server, auth-route, OpenAPI, and web page-generation tests were added before production code and initially failed because `prepareScanUploadTicket`, `scanUploadStorage`, `/api/scans/upload-url`, and scanner upload-ticket fetch wiring did not exist | Red verified |
| Create provider-neutral upload ticket contract | `packages/scanning/src/index.ts` exports `ScanUploadTicketRequest`, `ScanUploadTicket`, `ScanUploadStorage`, and `prepareScanUploadTicket()` | Implemented |
| Fail closed without storage | `prepareScanUploadTicket()` and `POST /api/scans/upload-url` return `failed_no_storage` without a configured storage provider | Implemented |
| Reject unsafe upload requests | `prepareScanUploadTicket()` validates scan id, kind, content type, byte length, and request timestamp before calling storage | Implemented |
| Protect the upload-ticket route | `/api/scans/upload-url` uses the same user-scoped bearer authorization path as `/api/scans/process` | Implemented |
| Document route contract | `buildOpenApiDocument()` includes protected `POST /api/scans/upload-url` | Implemented |
| Wire scanner page before scan processing | `apps/web/scripts/pages.mjs` requests an upload ticket, uses `ticket.payloadUri`, then calls `/api/scans/process` | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the upload-ticket bridge and narrows remaining scanner gaps to real capture, provider credentials, browser upload transfer, and OCR providers | Updated |
| PR and merge to `main` after the round | PR #329 is the merge vehicle for this audit | Pending until merge |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Scanning package | `packages/scanning/src/index.ts`, `packages/scanning/src/__tests__/pipeline.test.ts` | Adds upload-ticket request/result/storage types, validation, provider delegation, and fail-closed missing-storage result. |
| Server API | `packages/server/src/index.ts`, `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/auth-http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Adds `scanUploadStorage`, protected route handling, route auth coverage, and OpenAPI coverage. |
| Web bridge | `apps/web/scripts/pages.mjs`, `apps/web/scripts/pages.test.mjs` | Requests upload tickets before scan processing and routes `payloadUri` into the existing scan processor. |
| Status docs | `docs/status/completion-audit.md` | Records the shipped bridge and remaining live-provider/browser-transfer gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/scanning` before implementation | Failed because `prepareScanUploadTicket` was not exported and the storage callback request type was implicit `any` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` before implementation | Failed because `scanUploadStorage` was not in `AuthOptions` and the storage callback request type was implicit `any` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` before implementation | Failed because the scanner page did not call `/api/scans/upload-url` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/scanning && TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server && TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` after implementation | Targeted package tests passed: scanning 10 tests, server 40 tests, web 1 test; 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm test` | Full workspace test suite passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run build` | Full workspace build passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run typecheck` | Full workspace typecheck passed |
| `rtk git diff --check` | Whitespace check passed |

## Remaining gaps after this iteration

- The upload-ticket route is provider-neutral; real object-storage credentials and provider implementation are still missing.
- The scanner page requests a ticket and uses its `payloadUri`, but it does not yet transfer browser file bytes to the returned `uploadUrl`.
- Real camera capture and OCR providers remain outside this bridge.
