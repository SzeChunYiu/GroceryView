# Iteration 74 Deliverable Audit — PostgreSQL Readiness Endpoint

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration narrows the hosted PostgreSQL/live-smoke blocker after runtime pool bootstrap: the server now exposes a token-protected readiness route that checks the configured PostgreSQL schema and migration metadata through the same pool used by runtime persistence.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | The completion audit still listed a provisioned PostgreSQL service, applied migrations, and live smoke proof as deployment blockers after PR #281 | Selected PostgreSQL readiness endpoint |
| Add failing test before implementation | `packages/server/src/__tests__/postgres-readiness.test.ts` initially failed because `postgresReadinessProvider` was not part of `AuthOptions` | Red verified |
| Protect readiness evidence from public access | `/api/readiness/postgres` requires the existing metrics token header before returning schema/migration evidence | Implemented |
| Fail closed on blocked or unavailable database readiness | Blocked reports and provider exceptions return HTTP 503 with generic blockers rather than leaking database errors or secrets | Implemented |
| Wire runtime `DATABASE_URL` pool to readiness checks | `createRuntimeHttpService()` builds a readiness provider from the `pg` pool query executor when `DATABASE_URL` is configured | Implemented |
| Keep readiness checks read-only | Runtime tests assert the endpoint issues schema/migration reads and no insert/update/delete statements | Implemented |
| Document the route contract | `buildOpenApiDocument()` lists `/api/readiness/postgres` with `metricsToken` security | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` records the readiness endpoint and keeps live provisioning/migration/smoke blockers explicit | Updated |
| PR and merge to `main` after the round | PR #283 is the merge vehicle for this audit | Completed by this PR merge |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server runtime | `packages/server/src/index.ts` | Adds `postgresReadinessProvider`, token-gated `/api/readiness/postgres`, OpenAPI route docs, and runtime pool-backed readiness wiring. |
| Server tests | `packages/server/src/__tests__/postgres-readiness.test.ts`, `packages/server/src/__tests__/runtimeConfig.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Covers token protection, blocked/exception fail-closed behavior, OpenAPI security, and default runtime pool integration. |
| Status docs | `docs/status/completion-audit.md` | Records the endpoint while keeping live hosted database proof and migration execution as remaining blockers. |

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/server` before implementation | Failed because `postgresReadinessProvider` was missing from `AuthOptions` |
| `npm run test -w @groceryview/server` before fail-closed exception handling | Failed because a throwing readiness provider returned HTTP 400 instead of HTTP 503 |
| `npm run test -w @groceryview/server` after implementation | Server tests passed: 30 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm test` | Workspace and schema tests passed: 219 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run build` | Workspace build completed with exit code 0 |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run typecheck` | `tsc --noEmit -p tsconfig.json` completed with exit code 0 |
| `node --test tests/schema/completion-audit.test.mjs` | Completion audit schema test passed |
| `git diff --check` | No whitespace errors |

## Remaining gaps after this iteration

- The endpoint can prove a live server can read PostgreSQL schema and migration metadata, but production still needs a provisioned database, migrations applied, and an observed hosted smoke call against `/api/readiness/postgres`.
- Runtime readiness checks are intentionally read-only; repository round-trip smoke probes still belong in an operator-run preflight or controlled release job.
- Provider-specific billing, notification, OCR, retailer, deployment, and admin UI integrations remain outside this endpoint PR.
