# 10 — Final Verification Prompt

```text
You are verifying GroceryView after the Composer multitask implementation pass.

Check:
1. Feature implementation registry: no TODO_REGISTER; implemented rows have code evidence; deferred rows have explicit reason.
2. Atomic gap registry: summary counts match statuses; every done gap has test evidence; every open gap has reason and next ticket.
3. Public copy: no backstage/debug phrases on public pages.
4. Preview system: quick view reachable from search/deals/map/market; preview has full-page link.
5. Ad policy: slots labelled Advertisement; no ads in forbidden routes/surfaces; search ad only after result 12.
6. Backstage: admin pages exist and are clearly backstage; report helpers are used or scaffolded explicitly.
7. Data engineering: source-run/quality/dead-letter report scripts exist; idempotency helper exists; publish gate scaffold exists.
8. Analytics: event names centralized; metric dictionary and code references align.

Run:
npm run test -w @groceryview/web

Output:
- tests run
- remaining gaps
- recommended next PRs
```
