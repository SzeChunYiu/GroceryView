# PR rescue: ESLint failures

Audit date: 2026-05-24.

## Method

- Queried open PRs with failing status via `gh pr list --state open --search "status:failure"`.
- Checked each failing PR with `gh pr checks <number>` and filtered for `lint` / `eslint` failures.
- Local lint was not run because no PR currently exposed an ESLint-specific failing check to autofix.

## Result

No open PRs currently report an ESLint-specific failure.

Failing PRs found during the audit were failing other gates instead:

| PR | Branch | Failing gate observed | Lint action |
| --- | --- | --- | --- |
| #2014 | `ticket-cn015-p38-1396-nordic-vercel-domains` | No lint/ESLint failure in `gh pr checks` output | None |
| #1761 | `lunarc/feat-weekly-basket` | Vercel preview performance budget | Out of scope |
| #1660 | `factory/issue-909-stale-price-warnings` | Vercel preview performance budget | Out of scope |
| #1640 | `ticket-cn015-p31-fix` | Vercel preview performance budget | Out of scope |
| #1608 | `ticket-cn015-p6` | Vercel preview performance budget | Out of scope |
| #1575 | `lunarc/feat-cookies-page` | Vercel preview performance budget | Out of scope |
| #1574 | `lunarc/feat-privacy-export` | Vercel preview performance budget | Out of scope |
| #1573 | `lunarc/feat-account-deletion` | Vercel preview performance budget | Out of scope |
| #1377 | `task/ingest-ica-data-a-1779563963` | Test/build/typecheck and release-safe validation | Needs build-log triage, not confirmed ESLint |

## Recurring ESLint rule violations

None observed in the current failing-PR set.

If a future audit finds ESLint failures, record the rule name, affected files, autofix command, and PR pushed here before closing the rescue ticket.
