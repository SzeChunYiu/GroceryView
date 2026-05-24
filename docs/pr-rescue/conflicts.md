# PR conflict rescue audit

Date: 2026-05-24

Command used:

```bash
gh pr list -R SzeChunYiu/GroceryView --state open --limit 300 --json number,headRefName,title,mergeStateStatus
```

Result:

- 300 open PRs inspected.
- `mergeStateStatus` summary: 299 `BLOCKED`, 1 initially `UNKNOWN`.
- The initially unknown PR was re-read directly:
  - #2114 `ticket-cn015-p20-1523-meny-flyer-no` — `mergeable: MERGEABLE`, `mergeStateStatus: BLOCKED`.
- No PR reported GitHub's conflict/dirty state, so no PR branch required a conflict-resolution rebase in this pass.

Operational notes:

- `BLOCKED` means the PR is blocked by checks/review/rules, not necessarily by file conflicts.
- If a future audit reports `DIRTY`, rebase that PR branch on latest `origin/main`, resolve by preserving the PR's intended change with the smallest diff, push the PR branch, and append the PR number plus resolution notes here.
- Never force-push to `main`; only update PR branches.
