# Lighthouse / performance budget PR rescue log

Last checked: 2026-05-24 18:05 Europe/Stockholm.

## Queries run

- `gh pr list -R SzeChunYiu/GroceryView --state open --limit 200 --json number,title,headRefName,statusCheckRollup --jq '...Lighthouse Preview failures...'`
- `gh run list -R SzeChunYiu/GroceryView --workflow "Lighthouse Preview" --limit 200 --json databaseId,displayTitle,headBranch,conclusion,status,createdAt,url --jq '...failure conclusions...'`

## Current rescue findings

No open PR had a completed `Lighthouse Preview` check with a failing budget conclusion in the inspected set. The current queue was dominated by `queued` Lighthouse runs, so there was no completed LCP, CLS, or TBT regression to attribute and no safe code fix to apply.

| PR / branch | Lighthouse state | Metric regressed | Likely cause | Action |
| --- | --- | --- | --- | --- |
| Open PRs inspected | No completed failure found | None verified | None verified | No budget change and no code fix applied |

## Budget policy

Do not raise Lighthouse or performance budgets from this rescue ticket without a concrete completed failure showing that the existing budget is invalid. When a future PR fails, record the failing metric (LCP, CLS, or TBT), the route and artifact URL, the likely code cause, and the smallest fix before proposing any budget movement.
