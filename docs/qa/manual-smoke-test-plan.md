# Manual smoke test plan

Use this after automated release gates pass.

## Public flows

- [ ] Home: domain cards for groceries, pharmacy, and fuel open the expected routes.
- [ ] Search: submit a grocery query, verify filters/sort still work, and confirm ad placement is after result 12 only.
- [ ] Search all domains: open one grocery, one pharmacy, and one fuel result card.
- [ ] Deals: open a deal preview, verify Close and Escape behavior, then open the product page.
- [ ] Market: change filters, inspect heatmap/list fallback, and open a category trend.
- [ ] Map: change layers, open selected store/pharmacy/fuel detail, and verify list fallback copy.
- [ ] Watchlist: add a grocery/pharmacy/fuel target and confirm the page remains account-safe.

## Admin/reports

- [ ] `/admin/search-analytics` renders generated report status and search metrics.
- [ ] `/admin/data-quality`, `/admin/source-runs`, `/admin/query-performance`, and `/admin/storage` render generated or live report source labels.
- [ ] No public route exposes debug table names such as `raw_records`, `source_runs`, or `analytics_events`.

## Release commands

- [ ] `npm run test -w @groceryview/web`
- [ ] `npx tsc --noEmit`
- [ ] `node scripts/ops/release-readiness-report.mjs`
