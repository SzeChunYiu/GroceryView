# Iteration 151 deliverable audit: Next page export hardening

## Goal

Remove a production build blocker from the GroceryView web app by keeping app route exports compatible with Next.js page typing.

## Delivered in this iteration

- Moved the Grocery Index ticker widget contract into `apps/web/src/lib/grocery-index-widget.ts`.
- Kept the chain-index page rendering the same widget title, route, source-confidence counts, and iframe embed code through a private page-local constant.
- Added route-test coverage that prevents `src/app/chain-index/page.tsx` from exporting `groceryIndexTickerWidget` as a non-Next page field.
- Verified the webpack build path now type-checks and prerenders all 306 app routes locally after bypassing the known macOS Turbopack native-binding problem.
- Updated the completion audit with the build-hardening artifact and evidence.

## Files changed

- `apps/web/src/app/chain-index/page.tsx`
- `apps/web/src/lib/grocery-index-widget.ts`
- `apps/web/scripts/next-routes.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-151-deliverable-audit.md`

## Verification

- Red TDD check first failed because `apps/web/src/lib/grocery-index-widget.ts` was missing.
- `rtk node --test apps/web/scripts/next-routes.test.mjs --test-name-pattern "embeddable Grocery Index ticker"` passed after implementation.
- `rtk npm run test -w @groceryview/web -- --test-name-pattern "embeddable Grocery Index ticker"` passed.
- `rtk git diff --check` passed.
- `rtk npm run typecheck` passed.
- `rtk npm test` passed.
- `rtk npm run build -w @groceryview/web` remains blocked locally by the known macOS `@next/swc-darwin-arm64` code-signing/Turbopack native-binding issue.
- `npx next build --webpack` passed locally and generated all static app routes after this fix.

## Remaining gaps

- This is a build-readiness hardening step, not a full GroceryView completion claim.
- Hosted deployment still requires provider deployment, production secrets, live smoke evidence, and database/provider readiness proof.
