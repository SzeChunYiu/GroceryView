# Iteration 152 deliverable audit: deterministic web workspace build

## Goal

Make the GroceryView web workspace build command use the proven Next webpack path so `npm run build -w @groceryview/web` can complete on the local macOS arm64 environment where Turbopack native bindings are unavailable.

## Delivered in this iteration

- Updated the `@groceryview/web` package build script from `next build` to `next build --webpack`.
- Added a regression assertion in the legacy static-page test suite that the workspace build script stays on the webpack path.
- Verified the workspace build command now type-checks, compiles, and prerenders all 306 app routes through Next.js 16.2.6 with webpack.
- Updated the completion audit with the deterministic workspace build artifact and verification evidence.

## Files changed

- `apps/web/package.json`
- `apps/web/scripts/pages.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-152-deliverable-audit.md`

## Verification

- Red TDD check first failed because the test expected `--webpack` while `apps/web/package.json` still used `next build`.
- `rtk npm run test -w @groceryview/web -- --test-name-pattern "legacy static page generator"` passed after changing the build script.
- `rtk git diff --check` passed before documentation updates.
- `rtk npm run typecheck` passed.
- `rtk npm test` passed.
- `rtk npm run build -w @groceryview/web` passed and generated all 306 static app routes via webpack.

## Remaining gaps

- This removes a local workspace build blocker; it does not claim full GroceryView production completion.
- Hosted deployment still needs provider deployment, production secrets, DNS/observability, live DB-backed smoke evidence, and retailer/provider readiness proof.
