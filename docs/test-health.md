# Operator test health dashboard

`/admin/test-health` is the operator-only daily rollup for GroceryView release-safe validation.

## What it shows

- Latest run per test type: `npm ci`, `npm test`, schema integration tests, `npm run build`, and `npm run typecheck`.
- Pass/fail counts for the latest daily aggregate.
- Flaky-run count and flakiness percentage.
- Daily wall-time trend so operators can spot slowdowns before the release-safe candidate check times out.

## Operator gate

The page is no-indexed and intentionally absent from public navigation. Production should keep it behind Vercel Deployment Protection, VPN, or an authenticated operator session before replacing the checked-in aggregate with live CI artifacts.

## Release policy

1. Open the dashboard after the daily aggregation job completes.
2. Treat any failed latest run as a release blocker.
3. Escalate flakiness above 5% to the owner of the affected test type.
4. Before opening a release PR, still run the required local gate: `npm ci && npm test && npm run build && npm run typecheck`.
