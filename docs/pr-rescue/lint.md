# PR rescue: lint failures

Use this note when triaging GroceryView PRs that fail the CI lint job. Keep fixes scoped to the PR branch being rescued; do not mix unrelated formatting or refactors into the same push.

## Rescue loop

1. Open the failing PR check log and confirm the failure is ESLint-only, not typecheck, build, or tests.
2. Pull the PR branch and inspect the exact file/line reports from CI before editing.
3. Apply autofix only when the rule is mechanical and preserves behavior; otherwise make the smallest source change that satisfies the rule.
4. Push the repaired PR branch and wait for CI to rerun. If a new non-lint failure appears, hand it back to the owning ticket instead of broadening the rescue.
5. Leave a PR comment naming the recurring lint rule when the same pattern appears in more than one PR.

## Recurring rule violations

- **Unused imports and bindings**: frequent after merge conflict resolution or when a component prop is removed. Prefer deleting the unused symbol over adding placeholder reads.
- **Implicit `any` in small helpers**: add the narrow local type at the helper boundary instead of widening the exported API.
- **Hook dependency drift**: update the dependency list when a callback starts reading new values; do not suppress the rule unless the value is intentionally stable and documented inline.
- **Unescaped apostrophes in JSX copy**: rewrite the sentence or use the HTML entity in user-facing copy.
- **Import order churn**: keep framework imports, local component imports, and lib imports grouped consistently with the surrounding file.

## Autofix boundaries

Safe autofix candidates are whitespace, import ordering, and unused import removal. Avoid broad `--fix` runs on shared generated files or files outside the failing PR diff; large formatting churn makes the rescue PR harder to review.
