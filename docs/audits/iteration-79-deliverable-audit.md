# Iteration 79 Deliverable Audit — Household Plan API Bridge

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the household web/API gap by exposing a protected household plan write/read route, backing it with the API package, and wiring the static household page through the existing API session bridge.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature from remaining blockers | `docs/status/completion-audit.md` still listed household API writes as part of the interactive web gap after PR #318 | Selected household plan API bridge |
| Add regression coverage before completion | API, server, auth/OpenAPI, and web tests cover household plan API methods, `/api/households/current`, OpenAPI `put`, and the web fetch call | Covered |
| Persist household plan writes in the API layer | `createGroceryViewApi().upsertHouseholdPlan()` validates signed-in membership, members, basket items, watchlist items, shared favorite stores, budget, and approval policy before storing an in-memory plan | Implemented |
| Read household plan state | `createGroceryViewApi().getHouseholdPlan()` and `GET /api/households/current?userId=...` return the user-scoped plan or fail closed with 404 when absent | Implemented |
| Protect household routes | Existing bearer session enforcement protects `GET` and `PUT /api/households/current`; auth tests cover unauthenticated, wrong-user, and valid-session writes | Verified |
| Surface household summary and approval policy | The API returns member contribution counts, cheapest known basket total, remaining weekly budget, shared stores, and whether owner approval is required | Implemented |
| Wire web household form to API bridge | `apps/web/scripts/pages.mjs` submits household approval/member-attributed basket data to `/api/households/current` when an API session is configured and preserves explicit local preview mode otherwise | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the household bridge and narrows the remaining web gap to auth-provider exchange, durable DB-backed UI/household state, and provider-backed upload/session flows | Updated |
| PR and merge to `main` after the round | PR #323 is the merge vehicle for this audit | Pending until merge step |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| API package | `packages/api/src/index.ts`, `packages/api/src/__tests__/routes.test.ts` | Adds household plan request/response types, validation, in-memory persistence, summary derivation, and API tests. |
| Server API | `packages/server/src/index.ts`, `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/auth-http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Adds protected read/write route, request normalization, OpenAPI `PUT`, privacy export household IDs, and auth/route docs tests. |
| Web bridge | `apps/web/scripts/pages.mjs`, `apps/web/scripts/pages.test.mjs` | Connects the household form to the API session bridge while preserving fail-closed local preview copy. |
| Status docs | `docs/status/completion-audit.md` | Records shipped household API bridge and remaining production gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test --workspace @groceryview/api` | API route tests passed: 8 tests, 0 failures |
| `rtk npm run test --workspace @groceryview/server` | Server tests passed: 38 tests, 0 failures |
| `rtk npm run test --workspace @groceryview/web` | Web page-generation tests passed: 1 test, 0 failures |
| `rtk npm test` | Full workspace test suite passed |
| `rtk npm run build` | Full workspace build passed |
| `rtk npm run typecheck` | Full workspace typecheck passed |
| `rtk git diff --check` | Whitespace check passed |

## Remaining gaps after this iteration

- Household plans are persisted in the in-memory API package state only; durable PostgreSQL household storage and hosted smoke proof are still missing.
- The web bridge still requires manually configured API base/user/token until real auth-provider session exchange exists.
- Household approval policy is returned to the caller but not yet integrated with a real reviewer assignment or notification workflow.
