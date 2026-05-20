# Iteration 80 Deliverable Audit — Auth Session Exchange Bridge

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the login/session gap by adding a provider-neutral auth session exchange route that fails closed without configured provider verification and signs short-lived GroceryView bearer sessions only after the provider assertion is verified.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature from remaining blockers | `docs/status/completion-audit.md` still listed auth-provider session exchange as part of the interactive web gap after PR #323 | Selected auth session exchange bridge |
| Add failing tests before implementation | Server and web tests initially failed because `authSessionExchange`, `/api/auth/session`, OpenAPI docs, and login-page fetch wiring did not exist | Red verified |
| Fail closed without configured auth provider verification | `POST /api/auth/session` returns 503 unless both `authSecret` and `authSessionExchange.verify()` are configured | Implemented |
| Exchange verified provider assertions for bearer sessions | The route accepts provider assertion input, calls the configured verifier, signs a 7-day bearer session with `createSessionToken()`, and does not echo provider assertions in the response | Implemented |
| Reuse exchanged bearer token on protected routes | Server tests use the returned bearer token to call a protected user-scoped route successfully | Verified |
| Document route contract | `buildOpenApiDocument()` includes public `POST /api/auth/session` with no bearer requirement | Implemented |
| Wire login form to API session bridge | `apps/web/scripts/pages.mjs` posts login submissions to `/api/auth/session` when an API base is configured, stores returned bearer tokens in `sessionStorage`, and keeps local preview mode otherwise | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the provider-neutral auth session exchange and narrows the remaining login/web gap to real provider credentials plus durable hosted state | Updated |
| PR and merge to `main` after the round | PR #325 is the merge vehicle for this audit | Pending until merge step |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server API | `packages/server/src/index.ts`, `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Adds auth provider assertion types, verifier hook, fail-closed exchange route, signed token response, and OpenAPI coverage. |
| Web bridge | `apps/web/scripts/pages.mjs`, `apps/web/scripts/pages.test.mjs` | Connects the login form to the auth session exchange route and keeps bearer tokens in session storage only. |
| Status docs | `docs/status/completion-audit.md` | Records shipped auth exchange bridge and remaining provider credential/state gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` before implementation | Failed because `authSessionExchange` did not exist |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` before implementation | Failed because the login page did not call `/api/auth/session` |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/server` after implementation | Server tests passed: 39 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run test -w @groceryview/web` after implementation | Web page-generation tests passed: 1 test, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm test` | Full workspace test suite passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run build` | Full workspace build passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview rtk npm run typecheck` | Full workspace typecheck passed |
| `rtk git diff --check` | Whitespace check passed |

## Remaining gaps after this iteration

- The exchange route is provider-neutral; real passkey/magic-link/OIDC credentials and provider callback verification are still missing.
- The web login flow still depends on configured API base/provider verifier infrastructure before it can complete real sign-in.
- Session issuance is not yet backed by a durable revocation or refresh-token store.
