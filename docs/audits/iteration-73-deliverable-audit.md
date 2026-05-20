# Iteration 73 Deliverable Audit — PostgreSQL Runtime Bootstrap

## Objective restatement

Continue shipping GroceryView toward production readiness and merge each round through a PR. This iteration closes the next server deployment gap after runtime repository injection: when `DATABASE_URL` is present, the runtime server can now bootstrap a PostgreSQL-backed repository using the existing database adapter and `pg` pool instead of requiring callers to hand-wire every sink.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | The completion audit still listed a live PostgreSQL pool/bootstrap gap after PR #278 added generic repository injection | Selected PostgreSQL runtime bootstrap |
| Add failing test before implementation | `packages/server/src/__tests__/runtimeConfig.test.ts` initially failed because `createRuntimeHttpService()` and `pgPoolFactory` did not exist | Red verified |
| Bootstrap the runtime repository from `DATABASE_URL` | `createRuntimeHttpService()` creates a PostgreSQL repository from a `pg` pool when no explicit repository is provided | Implemented |
| Keep direct server lifecycle safe | `createRuntimeNodeServer()` and `startNodeServerFromEnv()` attach service cleanup to server close so the pool can be closed | Implemented |
| Reuse existing parameterized DB adapter | Server runtime imports `createPgQueryExecutor()` and `createPostgresRepository()` rather than writing SQL in the server package | Implemented |
| Preserve explicit injection for tests/alternate hosts | `RuntimeHandlerOptions.repository` still overrides default pool creation; `pgPoolFactory` gives tests and custom hosts a deterministic pool boundary | Implemented |
| Update package/build metadata | `@groceryview/server` depends on `@groceryview/db` and `pg`; workspace build now builds `@groceryview/db` before server | Updated |
| Refresh completion audit | `docs/status/completion-audit.md` records PostgreSQL runtime bootstrap and narrows remaining live deployment gaps | Updated |
| PR and merge to `main` after the round | PR #281 is the merge vehicle for this audit | Completed by this PR merge |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Server runtime | `packages/server/src/index.ts` | Adds runtime HTTP service, default `pg` pool creation, repository resource construction, and close handling. |
| Server tests | `packages/server/src/__tests__/runtimeConfig.test.ts` | Covers signed billing persistence through a PostgreSQL-backed runtime repository and reads the entitlement back through account access. |
| Package metadata | `package.json`, `packages/server/package.json`, `package-lock.json` | Adds runtime `pg` dependency and aligns build/test ordering for the new DB dependency. |
| Status docs | `docs/status/completion-audit.md` | Records the bootstrap and keeps hosted DB/migration/live smoke blockers explicit. |

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/server` before implementation | Failed because `createRuntimeHttpService` was missing and `pgPoolFactory` was not typed |
| `npm run test -w @groceryview/server` after implementation | Server tests passed: 26 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm test` | Workspace and schema tests passed: 215 tests, 0 failures |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run build` | Workspace build completed with exit code 0 |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run typecheck` | `tsc --noEmit -p tsconfig.json` completed with exit code 0 |
| `node --test tests/schema/completion-audit.test.mjs` | Completion audit schema test passed |
| `git diff --check` | No whitespace errors |

## Remaining gaps after this iteration

- Runtime can create a PostgreSQL-backed repository from `DATABASE_URL`, but live proof still requires a provisioned PostgreSQL service with migrations applied.
- The hosted server still needs real secrets, DNS, deployment provider configuration, observability, and smoke tests against the live service.
- Provider-specific billing, notification, OCR, retailer, and admin UI integrations remain outside this bootstrap PR.
