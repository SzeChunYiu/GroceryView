# Iteration 77 Deliverable Audit — Privacy Export and Deletion-Plan API

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the web/privacy API gap by exposing protected account privacy export and deletion-plan routes, then wiring the static privacy page actions to those routes when the API session bridge is configured.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | `docs/status/completion-audit.md` still listed privacy API writes as a remaining web gap after PR #309 | Selected protected privacy export/deletion-plan routes |
| Add failing tests before implementation | `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/auth-http.test.ts`, `packages/server/src/__tests__/openapi.test.ts`, and `apps/web/scripts/pages.test.mjs` initially failed because the privacy routes and web fetch calls did not exist | Red verified |
| Export signed-in account data | `GET /api/privacy/export?userId=...` returns the existing `buildPrivacyExport()` sections for profile, favorite stores, watchlist, receipts, and households with the server clock as `generatedAt` | Implemented |
| Plan account deletion without destructive action | `POST /api/privacy/deletion-plan?userId=...` returns `planAccountDeletion()` plus `destructiveAction: false` and `requiresReauthentication: true` | Implemented |
| Enforce user-scoped auth when auth is enabled | Existing `authorizeUser()` protects both privacy routes; auth tests cover unauthenticated, wrong-user, and valid-session cases | Verified |
| Document route contract | `buildOpenApiDocument()` includes both privacy routes with bearer auth security | Implemented |
| Wire web privacy actions to the API bridge | `apps/web/scripts/pages.mjs` makes privacy export and deletion buttons call the protected routes when configured, otherwise they stay in explicit local preview mode | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the privacy API routes and narrows the remaining web gap to auth-provider exchange, household/scanner writes, durable DB-backed UI state, and upload/session providers | Updated |
| PR and merge to `main` after the round | PR #311 is the merge vehicle for this audit | Pending until merge step |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server API | `packages/server/src/index.ts` | Adds protected privacy export and deletion-plan routes using existing core privacy primitives. |
| Server tests | `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/auth-http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Covers route outputs, bearer auth behavior, and OpenAPI security. |
| Web bridge | `apps/web/scripts/pages.mjs`, `apps/web/scripts/pages.test.mjs` | Connects privacy action buttons to authenticated API calls under the existing API session bridge. |
| Status docs | `docs/status/completion-audit.md` | Records shipped privacy API routes and remaining production gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` before implementation | Failed with missing privacy routes/OpenAPI entries and auth status mismatches |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` after implementation | Server tests passed: 34 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` after implementation | Web page-generation tests passed: 1 test, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm test` | Workspace and schema tests passed with no failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run build` | Workspace build completed with exit code 0 |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run typecheck` | `tsc --noEmit -p tsconfig.json` completed with exit code 0 |
| `rtk git diff --check` | No whitespace errors |

## Remaining gaps after this iteration

- Privacy export reflects currently available in-process account state; production durability still depends on the configured runtime repository and hosted database.
- The deletion route intentionally plans deletion only; destructive execution still needs re-authentication, operational safeguards, and repository-backed delete/anonymize execution.
- Household and scanner web actions still need server-backed writes/providers, and real auth-provider session exchange remains missing.
