# Iteration 149 deliverable audit: account billing action controls

## Goal

Turn the shipped Stripe checkout-session and billing-portal APIs into real account-page controls without opening an anonymous checkout path.

## Delivered in this iteration

- Added a signed-in account billing client component on `/account`.
- Loaded subscription access through `/api/account/subscription-access?userId=${encodeURIComponent(userId)}` using the `sessionStorage` bearer token.
- Added monthly and yearly checkout buttons that POST account-bound plan requests to `/api/billing/checkout-sessions?userId=${encodeURIComponent(userId)}`.
- Added a subscription management button that POSTs to `/api/billing/portal-sessions?userId=${encodeURIComponent(userId)}`.
- Validated redirect responses before calling `window.location.assign()` for checkout or portal URLs.
- Failed closed when the session is absent with explicit “Sign in first” and “No anonymous billing sessions” messaging.
- Updated the completion audit to record the new UI bridge while preserving remaining production blockers.

## Files changed

- `apps/web/src/components/account-billing-actions.tsx`
- `apps/web/src/app/account/page.tsx`
- `apps/web/scripts/next-routes.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-149-deliverable-audit.md`

## Verification

- Red TDD check first failed because `apps/web/src/components/account-billing-actions.tsx` did not exist.
- `rtk node --test apps/web/scripts/next-routes.test.mjs --test-name-pattern "account billing controls"` passed after implementation.
- `rtk npm run test -w @groceryview/web -- --test-name-pattern "account billing controls"` passed.
- `rtk git diff --check` passed.
- `rtk npm run typecheck` passed.
- `rtk npm test` passed.
- `rtk npm run build -w @groceryview/web` is still blocked locally by the known macOS `@next/swc-darwin-arm64` code-signing/Turbopack native-binding issue.
- `npx next build --webpack` bypassed Turbopack locally, compiled successfully, then stopped on the pre-existing Next page export type error in `src/app/chain-index/page.tsx` (`groceryIndexTickerWidget` is not a valid page export).

## Remaining gaps

- Live checkout and billing portal proof still requires production Stripe credentials, configured price IDs, persisted Stripe-compatible customer records, real auth-provider sessions, a migrated hosted database, and hosted smoke evidence.
- This iteration does not complete the full GroceryView proposal; it narrows the interactive billing UI blocker only.
