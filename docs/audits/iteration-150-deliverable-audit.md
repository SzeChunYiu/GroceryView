# Iteration 150 deliverable audit: reviewer decision actions

## Goal

Reduce the human-review operations gap by turning the protected decision endpoint into a complete signed-in reviewer action surface.

## Delivered in this iteration

- Extended the price-report human-review controls with a third `needs_more_info` decision.
- Kept all decisions routed through `/api/human-review/assignments/${encodeURIComponent(assignmentId)}/decisions?userId=${encodeURIComponent(userId)}` with the `sessionStorage` bearer token.
- Preserved fail-closed behavior when no signed-in reviewer session is available.
- Made the UI explicit that `needs_more_info` leaves the assignment status `in_progress`, matching the existing server endpoint behavior.
- Updated the completion audit to move “reviewer decision UI actions beyond queue loading” from missing to shipped evidence while keeping hosted provider/database proof blockers.

## Files changed

- `apps/web/src/components/price-report-review-actions.tsx`
- `apps/web/scripts/next-routes.test.mjs`
- `docs/status/completion-audit.md`
- `docs/audits/iteration-150-deliverable-audit.md`

## Verification

- Red TDD check first failed because the component did not expose `needs_more_info`, “Request more info”, or the `status in_progress` copy.
- `rtk node --test apps/web/scripts/next-routes.test.mjs --test-name-pattern "price-report human review controls"` passed after implementation.
- `rtk npm run test -w @groceryview/web -- --test-name-pattern "price-report human review controls"` passed.
- `rtk git diff --check` passed.
- `rtk npm run typecheck` passed.
- `rtk npm test` passed.
- `rtk npm run build -w @groceryview/web` is still blocked locally by the known macOS `@next/swc-darwin-arm64` code-signing/Turbopack native-binding issue.

## Remaining gaps

- Live human-review operations still require production auth-provider credentials, production session-to-reviewer mapping, a migrated hosted database, hosted account-enforcement proof, and live PostgreSQL smoke evidence.
- This iteration does not complete the full GroceryView proposal; it narrows the human-review decision UI blocker only.
