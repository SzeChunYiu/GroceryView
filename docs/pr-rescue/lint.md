# PR rescue: lint failures

Audit date: 2026-05-24 15:55 UTC.

## Scope

Ticket scope: identify open GroceryView PRs with ESLint failures, run lint/autofix where possible, push fixes, and document recurring lint-rule violations.

## Current PR lint status

Command used:

```sh
gh pr list -R SzeChunYiu/GroceryView --state open --limit 80 --json number,headRefName,title,statusCheckRollup
```

Result summary: no open PR in the returned set exposed a completed ESLint failure check. The visible check suite was still queued for the listed PRs, with the shared checks:

- `Test, build, and typecheck` — `QUEUED`
- `Vercel preview performance budget` — `QUEUED`
- `Validate release-safe candidate` — `QUEUED`

Because no PR had a completed lint failure at audit time, no autofix branch push was performed from this rescue pass.

## Recurring lint issues to watch

When ESLint failures appear, prioritize these recurring patterns seen in GroceryView PRs and connector work:

1. **Unused exports/imports after narrow ticket edits** — remove unused React component imports, helper functions, and type-only imports.
2. **Unescaped apostrophes in JSX text** — use `&apos;` or rewrite copy in `.tsx` pages/components.
3. **Array index keys in mapped UI rows** — prefer stable product IDs, route slugs, or composite source keys.
4. **Implicit `any` in connector parsers** — type parsed JSON as `Record<string, unknown>` and narrow before use.
5. **Floating promises in scripts/jobs** — await async work or explicitly handle with `void` only for intentional fire-and-forget calls.
6. **Non-null assertions on optional connector data** — guard scraped fields before numeric parsing or URL normalization.

## Rescue procedure for the next failure

1. Re-run the PR list command and filter for completed failures containing ESLint output.
2. Check out the failing PR branch.
3. Run the repository lint command or package-specific lint command for the touched package.
4. Apply `--fix` only when it produces a minimal, reviewable diff.
5. Manually fix any remaining rule violations.
6. Push to the same PR branch and record the PR number, rule, and fix in this document.
