# Iteration 70 Deliverable Audit — Billing Subscription Webhook Contract

## Objective restatement

Continue shipping GroceryView toward production readiness, prioritize the next important missing monetization feature, and merge the work through a PR. This iteration narrows the subscription billing gap by adding a provider-neutral signed webhook contract that can persist billing subscription events as account entitlements.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Choose next concrete feature without repeating shipped work | Completion audit still listed billing webhook endpoints as missing after entitlement persistence/access/read UI shipped | Selected billing subscription webhook contract |
| Add failing domain test before implementation | `packages/monetization/src/__tests__/monetization.test.ts` initially failed because `processBillingSubscriptionEvent` was not exported | Red verified |
| Normalize billing subscription events | `processBillingSubscriptionEvent()` maps active, past-due, and canceled provider-neutral events into entitlement mutations | Implemented |
| Add failing HTTP route tests before implementation | `packages/server/src/__tests__/http.test.ts` initially failed because `billingWebhookSecret` and `billingSubscriptionSink` were not valid server options | Red verified |
| Require signed webhook delivery | `/api/billing/subscription-events` verifies `x-groceryview-billing-signature` against a configured billing webhook secret before parsing or persisting | Implemented |
| Persist only through an explicit sink | The route fails closed without `billingSubscriptionSink` and calls `upsertSubscriptionEntitlement()` only after signature and payload validation | Implemented |
| Keep sensitive payment data out of this endpoint | The route rejects card/client-secret/payment-method style top-level fields before persistence, and the success response excludes provider customer/subscription IDs | Implemented |
| Document route contract | OpenAPI includes `/api/billing/subscription-events` and `billingWebhookSignature`; runtime health/config/deploy manifest track `BILLING_WEBHOOK_SECRET` without exposing the value | Implemented |
| Refresh completion audit | `docs/status/completion-audit.md` adds the billing webhook contract row and narrows the monetization gap wording | Updated |
| PR and merge to `main` after the round | PR #264 merged to `main` with merge commit `aad6457` | Completed |

## Implementation scope

| Area | Files | Notes |
| --- | --- | --- |
| Monetization domain | `packages/monetization/src/index.ts`, `packages/monetization/src/__tests__/monetization.test.ts` | Adds provider-neutral subscription event types and entitlement mutation normalization. |
| Server API | `packages/server/src/index.ts`, `packages/server/src/__tests__/http.test.ts` | Adds signed billing webhook route, fail-closed secret/sink checks, payload validation, and persistence sink wiring. |
| API contract/runtime | `packages/server/src/__tests__/openapi.test.ts`, `packages/server/src/__tests__/runtimeConfig.test.ts`, `deploy/groceryview.manifest.json`, `tests/schema/deploy.test.mjs` | Documents route/signature header and adds runtime config, health, and deploy-manifest signals for the billing webhook secret. |
| Status docs | `docs/status/completion-audit.md` | Records shipped webhook contract and remaining live provider/adapter gaps. |

## Verification evidence

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/monetization` before implementation | Failed because `processBillingSubscriptionEvent` was not exported |
| `npm run test -w @groceryview/monetization` after implementation | Monetization tests passed |
| `npm run test -w @groceryview/server` before route implementation | Failed because billing webhook options were missing from `AuthOptions` |
| `npm run test -w @groceryview/server` after implementation | Server tests passed |
| `node --test tests/schema/deploy.test.mjs` before manifest update | Failed because `BILLING_WEBHOOK_SECRET` was missing from required server env |
| `node --test tests/schema/deploy.test.mjs` after manifest update | Deployment manifest test passed |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm test` | 206 tests passed across workspace and schema suites |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run build` | Workspace build completed with exit code 0 |
| `TMPDIR=/Volumes/MyDrive/tmp/groceryview npm run typecheck` | `tsc --noEmit -p tsconfig.json` completed with exit code 0 |

## Remaining gaps after this iteration

- The billing route accepts a normalized provider-neutral event; Stripe/AdMob/AdSense-specific adapters and signature formats still need real provider integration.
- The route needs production repository injection to connect `billingSubscriptionSink` to a live PostgreSQL-backed repository.
- Live checkout, billing portal redirect, live provider webhook delivery, real billing credentials, and account UI enforcement are still outside this increment.
