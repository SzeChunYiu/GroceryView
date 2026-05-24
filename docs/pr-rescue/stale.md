# Stale PR rescue audit

Audit date: 2026-05-24.

Criterion: open PRs in `SzeChunYiu/GroceryView` with no activity for more than 14 days (`updated_at` before 2026-05-10T00:00:00Z).

## Result

No open PRs met the stale criterion.

Oldest open PR updates sampled from GitHub REST API:

| PR | Title | Last activity |
| --- | --- | --- |
| #1344 | feat(web): wire meal planner deal suggestions | 2026-05-23T14:26:30Z |
| #1329 | feat(web): rank nutrition value with confidence | 2026-05-23T15:21:58Z |
| #1358 | Keep DB cutover audit scoped | 2026-05-23T15:38:00Z |
| #1360 | test(ingest): verify ICA source summary sync | 2026-05-23T17:40:46Z |
| #1367 | ops: capture db IO hotspots | 2026-05-23T18:51:45Z |

## Actions taken

- Status comments posted: none, because no open PR was older than 14 days without activity.
- PRs closed as duplicates: none, because no stale PRs were found.

Command used for stale filtering:

```sh
gh api -X GET repos/SzeChunYiu/GroceryView/pulls -f state=open -f per_page=100 --paginate \
  --jq '.[] | select(.updated_at < "2026-05-10T00:00:00Z") | [.number,.title,.user.login,.updated_at,.head.ref] | @tsv'
```
