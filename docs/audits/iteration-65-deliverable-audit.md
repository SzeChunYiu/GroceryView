# Iteration 65 Deliverable Audit — Subscription Entitlement Persistence

## Objective restatement

Continue shipping GroceryView toward production readiness, prioritize the next important missing feature, and merge the work through a PR. This iteration narrows the monetization/account gap by adding durable subscription entitlement storage that account UI and API enforcement can read without storing payment secrets.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | Completion audit listed subscription entitlement persistence and account enforcement as remaining monetization gaps after provider-readiness gates | Selected entitlement persistence |
| Add failing test before implementation | `packages/db/src/__tests__/repository.test.ts` and `packages/db/src/__tests__/postgresAdapter.test.ts` called missing entitlement repository methods; initial `npm run test -w @groceryview/db` failed at TypeScript compile with missing methods | Red verified |
| Persist account entitlements in memory repository | `createMemoryRepository()` stores `SubscriptionEntitlementRecord` by `userId` and replaces stale provider fields when a user downgrades | Implemented |
| Persist account entitlements in PostgreSQL repository | `createPostgresRepository()` upserts and reads `subscription_entitlements` with parameterized SQL | Implemented |
| Add schema/migration support | `db/schema.sql`, `db/migrations/009_subscription_entitlements.sql`, and `infra/db/migrations/003_subscription_entitlements.sql` add the entitlement table and lookup/uniqueness indexes | Implemented |
| Keep payment data fail-closed and minimal | Schema stores provider/customer/subscription identifiers only; tests assert no card/CVC/client-secret columns | Verified |
| Extend PostgreSQL readiness probes | `POSTGRES_INTEGRATION_REQUIRED_TABLES`, `POSTGRES_INTEGRATION_REQUIRED_MIGRATIONS`, and `buildPostgresRepositorySmokeProbes()` now include entitlement table/migration/round-trip evidence | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` adds the entitlement persistence row and narrows the remaining billing/account gap | Updated |
| PR and merge to `main` after the round | PR #231 | Pending until merge step |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Repository contract | `packages/db/src/index.ts` | Adds `SubscriptionEntitlementRecord`, memory implementation, PostgreSQL mapper, and parameterized upsert/read methods. |
| DB tests | `packages/db/src/__tests__/repository.test.ts`, `packages/db/src/__tests__/postgresAdapter.test.ts`, `packages/db/src/__tests__/integrationReadiness.test.ts`, `packages/db/src/__tests__/infraSchema.test.ts` | Covers in-memory replacement, PostgreSQL SQL/row mapping, readiness constants, migration contract, and smoke probes. |
| Schema/migrations | `db/schema.sql`, `db/migrations/009_subscription_entitlements.sql`, `infra/db/migrations/003_subscription_entitlements.sql`, `infra/db/scripts/verify-migrations.sh`, `infra/db/SCHEMA.md` | Adds durable entitlement table with provider-subscription uniqueness and status lookup index. |
| Status docs | `docs/status/completion-audit.md` | Records shipped entitlement persistence and remaining production billing/account gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/db` before implementation | Failed with missing `upsertSubscriptionEntitlement` / `getSubscriptionEntitlement` methods |
| `npm run test -w @groceryview/db` after implementation | 63 tests passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm test` | 185 tests passed across workspace and schema suites |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run build` | Workspace build completed with exit code 0 |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run typecheck` | `tsc --noEmit -p tsconfig.json` completed with exit code 0 |

## Remaining gaps after this iteration

- This stores entitlement state but does not implement real billing webhooks, provider-specific signature verification, or checkout session creation against a live provider.
- Account UI/API enforcement can now read entitlement state, but interactive account enforcement screens and real session wiring remain outside this increment.
- Live PostgreSQL proof still requires a provisioned database and executing the repository smoke probes against it.
