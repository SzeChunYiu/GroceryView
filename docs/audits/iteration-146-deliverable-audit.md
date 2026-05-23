# Iteration 146 deliverable audit — Stripe webhook signature adapter

## Goal

Continue shipping GroceryView toward production readiness and merge the round through a PR. This iteration narrows the subscription billing provider gap by accepting Stripe's native webhook signature header for subscription entitlement events while preserving the existing provider-neutral GroceryView signature contract.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Accept Stripe-native webhook delivery | `/api/billing/subscription-events` now validates `stripe-signature` `t=` and `v1=` HMAC payloads against `BILLING_WEBHOOK_SECRET` | Implemented |
| Keep existing provider-neutral webhook compatibility | The existing `x-groceryview-billing-signature` path remains accepted before falling back to Stripe-native validation | Preserved |
| Reject replay-stale Stripe signatures | Stripe-native signatures fail closed when the header timestamp is outside the 300-second tolerance window | Implemented |
| Document accepted auth schemes | OpenAPI now publishes both `billingWebhookSignature` and `stripeWebhookSignature` security schemes for the billing webhook route | Implemented |
| Prove with focused tests | Server HTTP tests cover accepted Stripe-native signatures and stale-signature rejection; OpenAPI tests cover the new security scheme | Verified |
| Refresh completion audit | `docs/status/completion-audit.md` records the Stripe webhook signature adapter and narrows remaining billing-provider wording | Updated |

## Files touched

| Area | Files | Notes |
| --- | --- | --- |
| Server webhook security | `packages/server/src/index.ts` | Adds constant-time Stripe `v1` HMAC validation with a five-minute timestamp tolerance and documents OpenAPI security. |
| Server tests | `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Covers provider-native Stripe acceptance, stale replay rejection, and OpenAPI contract exposure. |
| Status docs | `docs/status/completion-audit.md`, `docs/audits/iteration-146-deliverable-audit.md` | Records this iteration and remaining production billing gaps. |

## Verification

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/server -- --test-name-pattern="stale provider-native Stripe"` before implementation | Failed with `202 !== 401`, proving stale Stripe signatures were not yet rejected |
| `npm run test -w @groceryview/server -- --test-name-pattern="provider-native Stripe|stale provider-native Stripe|buildOpenApiDocument"` | Passed |

## Remaining gaps

- Live Stripe webhook delivery still needs production `BILLING_WEBHOOK_SECRET`, provider dashboard configuration, and hosted delivery proof.
- Checkout session creation and billing portal redirects remain outside this increment.
- Additional billing providers, if chosen, still need their own native webhook adapters and replay protections.
