# Iteration 141 Deliverable Audit — Saved shopping account contract

## Objective
Turn the research finding “saved baskets and favorite stores tied to logged-in accounts” into a real GroceryView product surface while keeping private account state fail-closed in the static public build.

## Delivered product surface
- Product PR: #909, `Surface saved shopping account contract`
- Merged at: 2026-05-22T13:28:01Z
- Merge commit: `ceb5dff808abc1560c72dbe257af3c6844127508`
- Main verification: `git merge-base --is-ancestor ceb5dff808abc1560c72dbe257af3c6844127508 origin/main`

The `/account` page now renders an account-bound contract for `Saved baskets & favorite stores` instead of a generic unavailable placeholder. It names the favorite-store API routes, the `weekly_baskets` and `basket_items` persistence tables, the signed-in session inputs required before private state is read, and the static snapshot blockers that prevent anonymous or fabricated account rows.

## Verification evidence
| Check | Command / source | Result |
| --- | --- | --- |
| TDD red | `rtk npm run test -w @groceryview/web -- --test-name-pattern="account-bound saved baskets"` before implementation | Failed on missing `accountSavedShoppingContract` in `apps/web/src/lib/verified-data.ts`. |
| Targeted web contract test | `rtk npm run test -w @groceryview/web -- --test-name-pattern="account-bound saved baskets"` | Passed: 65 web route tests, including the account-bound saved baskets assertion. |
| Diff hygiene | `rtk git diff --check` | Passed. |
| Full test suite | `rtk npm test` | Passed across core, web route, ingestion, DB, workflow, and mobile suites. |
| Production build | `rm -rf apps/web/.next && rtk npm run build` | Passed; Next generated 203 static pages. SWC code-signing warnings were emitted, but build exited 0. |
| Typecheck | `rtk npm run typecheck` | Passed. |
| GitHub checks | PR #909 `Test, build, and typecheck`; `Validate release-safe candidate` | Both completed successfully before merge. |
| Merge proof | `rtk gh pr view 909 --json state,mergedAt,mergeCommit,statusCheckRollup,url` plus ancestor check | PR #909 is `MERGED`; merge commit is on `origin/main`. |

## Guardrails preserved
- The static web build does not bundle private saved baskets or favorite-store rows.
- The account page does not import `@/lib/demo-data` and does not show fabricated account preferences.
- The product copy states that saved shopping state is for signed-in shoppers only.
- Favorite stores are linked to verified GroceryView store records; baskets are linked to account-owned `weekly_baskets` and `basket_items` state.
- Account API contract copy stays separate from public catalogue evidence so verified price rows remain auditable.

## Code-review graph note
The repository instructions prefer code-review-graph MCP tools before manual exploration. Those MCP tools were not available in this session, so implementation and verification used targeted file inspection and tests instead.

## Remaining research findings
This round shipped the saved-shopping account contract surface. Remaining research-to-product work still includes deeper authenticated runtime UI, production auth/session wiring, account mutation flows, and any further research findings not yet represented by merged product PRs.
