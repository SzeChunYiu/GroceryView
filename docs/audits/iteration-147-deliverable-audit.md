# Iteration 147 deliverable audit — Stripe checkout session bridge

## Goal

Continue shipping GroceryView toward production readiness and merge the round through a PR. This iteration narrows the subscription billing gap by adding an account-bound checkout-session endpoint that can call a Stripe-compatible provider instead of stopping at a provider-neutral checkout plan.

## Delivered

| Requirement | Evidence | Status |
| --- | --- | --- |
| Account-bound checkout endpoint | `/api/billing/checkout-sessions?userId=...` creates checkout sessions only after the standard bearer-token user authorization gate | Implemented |
| Provider-backed Stripe-compatible session creation | Runtime config reads `STRIPE_SECRET_KEY` and `STRIPE_PRICE_PREMIUM_MONTHLY` / `STRIPE_PRICE_PREMIUM_YEARLY`, then posts a subscription checkout request to `https://api.stripe.com/v1/checkout/sessions` | Implemented |
| Fail closed without credentials or plan prices | The endpoint returns `503` with the monetization checkout blocker when provider credentials, public web URL, or the requested price id is absent | Implemented |
| Avoid secret leakage | Responses return only provider, session id, checkout URL, and plan; tests assert runtime checkout output does not include the Stripe secret | Verified |
| Document API and ops requirements | OpenAPI now includes `/api/billing/checkout-sessions`; deploy manifest, `.env.example`, production secret audit, runbook, and completion audit list the Stripe checkout env requirements | Updated |

## Files touched

| Area | Files | Notes |
| --- | --- | --- |
| Server runtime/API | `packages/server/src/index.ts` | Adds checkout provider types, Stripe-compatible checkout-session adapter, runtime env parsing, and the protected checkout route. |
| Server tests | `packages/server/src/__tests__/http.test.ts`, `packages/server/src/__tests__/runtimeConfig.test.ts`, `packages/server/src/__tests__/openapi.test.ts` | Covers account-bound checkout creation, fail-closed missing provider config, runtime Stripe API request shape, and OpenAPI exposure. |
| Ops/readiness | `.env.example`, `deploy/groceryview.manifest.json`, `scripts/ops/check-production-secrets.mjs`, `tests/schema/deploy.test.mjs`, `tests/schema/production-secrets-script.test.mjs`, `docs/ops/production-daily-ingestion-readiness.md` | Makes Stripe checkout credentials visible in deployment and production secret gates. |
| Status docs | `docs/status/completion-audit.md`, `docs/audits/iteration-147-deliverable-audit.md` | Records this increment and remaining production billing gaps. |

## Verification

| Command | Result |
| --- | --- |
| `npm run test -w @groceryview/server -- --test-name-pattern="billing checkout sessions|buildOpenApiDocument"` before implementation | Failed at TypeScript compile because checkout auth options did not exist |
| `npm run test -w @groceryview/server -- --test-name-pattern="Stripe-compatible API|loads production runtime"` before runtime adapter | Failed because runtime config did not expose Stripe fields and checkout returned `503` |
| `node --test tests/schema/deploy.test.mjs tests/schema/production-secrets-script.test.mjs` before ops updates | Failed because deploy and secret-audit gates did not require Stripe checkout env vars |
| `node --test tests/schema/deploy.test.mjs tests/schema/production-secrets-script.test.mjs` | Passed |
| `npm run test -w @groceryview/server -- --test-name-pattern="billing checkout sessions|Stripe-compatible API|buildOpenApiDocument"` | Passed |

## Remaining gaps

- Production still needs real Stripe secrets/price ids configured in the deployment environment and verified by a hosted smoke run.
- Checkout completion still depends on live Stripe webhook delivery and entitlement persistence, which require provider dashboard setup and production delivery proof.
- Billing portal/manage-subscription redirects remain outside this increment.
