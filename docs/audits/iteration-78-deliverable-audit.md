# Iteration 78 Deliverable Audit — Scan Processing API Bridge

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the scanner API gap by exposing a protected scan-processing route that can run barcode and receipt payloads through configured providers, return fail-closed provider-missing results, and surface human-review work items for low-confidence scan outcomes.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | `docs/status/completion-audit.md` still listed scanner API writes and real scan provider flow gaps after PR #311 | Selected protected scan-processing route |
| Add failing tests before implementation | Server, web, and workspace-script tests initially failed because `scanProviders`, `/api/scans/process`, web fetch calls, and the server scanning workspace dependency did not exist | Red verified |
| Process barcode/receipt scan payloads through configured providers | `POST /api/scans/process?userId=...` accepts `scanId`, `kind`, `payload`, and optional `uploadedAt`, then calls `processScanUpload()` with configured `scanProviders` | Implemented |
| Return human-review routing work | The route calls `planScanReviewWorkItems()` and returns `reviewWorkItems` for unresolved barcode and low-confidence receipt results | Implemented |
| Fail closed without real providers | The route passes an empty provider set when none are configured, preserving `failed_no_provider` scan results instead of pretending OCR/barcode capability exists | Implemented |
| Enforce user-scoped auth when auth is enabled | Existing `authorizeUser()` protects `/api/scans/process`; auth tests cover unauthenticated, wrong-user, and valid-session cases | Verified |
| Document route contract | `buildOpenApiDocument()` includes `/api/scans/process` with bearer auth security | Implemented |
| Wire web scanner action to the API bridge | `apps/web/scripts/pages.mjs` posts scanner form submissions to `/api/scans/process` when the API session bridge is configured, otherwise stays in explicit local preview mode | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the scan-processing bridge and narrows remaining scan/web gaps to real providers, durable upload storage, auth-provider exchange, household writes, and hosted DB state | Updated |
| PR and merge to `main` after the round | PR #318 is the merge vehicle for this audit | Pending until merge step |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server API | `packages/server/src/index.ts`, `packages/server/package.json`, `package.json`, `package-lock.json` | Adds scanning dependency/build order, `scanProviders`, protected scan-processing route, and OpenAPI docs. |
| Server tests | `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/auth-http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Covers provider-backed barcode/receipt processing, review work item return, bearer auth behavior, and OpenAPI security. |
| Web bridge | `apps/web/scripts/pages.mjs`, `apps/web/scripts/pages.test.mjs` | Connects scanner upload form to the authenticated scan-processing route under the API session bridge. |
| Workspace guard | `tests/schema/workspace-scripts.test.mjs` | Requires server tests to build `@groceryview/scanning` before importing server test output. |
| Status docs | `docs/status/completion-audit.md` | Records shipped bridge and remaining production scan/provider gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` before implementation | Failed because `scanProviders` was not part of `AuthOptions` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` after implementation | Server tests passed: 35 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` after implementation | Web page-generation tests passed: 1 test, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk node --test tests/schema/workspace-scripts.test.mjs` after implementation | Workspace script dependency test passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/api` after rebase | API route tests passed against the updated upstream alert metadata behavior |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm test` | Full workspace test suite passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run build` | Full workspace build passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run typecheck` | Full workspace typecheck passed |
| `rtk git diff --check` | Whitespace check passed |

## Remaining gaps after this iteration

- This route is provider-neutral; real barcode/OCR credentials, camera upload transport, and durable object storage are still missing.
- Review work items are returned to the caller but not yet persisted as human-review assignments.
- The web scanner action still depends on a manually configured bearer token until real auth-provider session exchange exists.
