# PR rescue: merge conflicts

Use this note when triaging GroceryView PRs that GitHub marks as conflicting with `origin/main`. Keep every rescue push scoped to the PR branch being repaired; never force-push to `main`.

## Rescue loop

1. Fetch the latest base and the PR branch, then create a local rescue branch from the PR head.
2. Rebase or merge onto `origin/main` only for that PR branch. Prefer the smallest diff that preserves the PR's original intent.
3. Resolve generated or shared-barrel conflicts conservatively: keep all non-duplicate exports and avoid hand-editing generated data unless the PR already owns that artifact.
4. Inspect the final diff against `origin/main` and confirm it only contains the rescued PR's intended changes plus conflict-resolution glue.
5. Push the repaired PR branch and let CI rerun. If CI reveals a behavior failure unrelated to the conflict, hand it back to the owning ticket instead of widening the rescue.

## Common conflict patterns

- **Navigation and route lists**: keep links from both sides when they point to distinct routes; sort or group them to match the surrounding navigation structure.
- **Generated grocery data**: prefer the newest generated artifact from `origin/main` unless the PR explicitly regenerated that same source.
- **Shared exports**: retain all unique export lines from both branches. Do not drop another ticket's export to make the conflict disappear.
- **Copy-only cards and dashboards**: preserve the PR's user-facing copy while adopting updated layout wrappers from `origin/main`.
- **Tests that assert source snippets**: update expectations only when the resolved source still covers the original behavior.

## Verification before pushing

- `git diff --check` is safe for conflict whitespace; do not run the local monorepo build/typecheck on this node.
- Confirm `git diff origin/main...HEAD` is reviewable and does not include unrelated queue work.
- Confirm no new tickets were created while recording the rescue outcome.
