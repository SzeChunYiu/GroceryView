# Domain completion matrix

All cells for GroceryView's grocery, fuel/gas, and pharmacy OTC domains now close as `yes + tested`. There are no open release blockers in this matrix.

| Requirement | Grocery | Fuel/Gas | Pharmacy OTC |
|---|---:|---:|---:|
| Landing page | yes + tested | yes + tested | yes + tested |
| Search domain | yes + tested | yes + tested | yes + tested |
| Detail page | yes + tested | yes + tested | yes + tested |
| Map layer | yes + tested | yes + tested | yes + tested |
| Map selected detail | yes + tested | yes + tested | yes + tested |
| Watchlist/alerts | yes + tested | yes + tested | yes + tested |
| Evidence/confidence | yes + tested | yes + tested | yes + tested |
| Claim-boundary tests | yes + tested | yes + tested | yes + tested |
| Admin/backstage reports | yes + tested | yes + tested | yes + tested |
| Analytics events | yes + tested | yes + tested | yes + tested |
| Release-ready | yes + tested | yes + tested | yes + tested |

## Evidence anchors

- Grocery: `atomic-gap-registry.test.mjs`, `cross-domain-closure.test.mjs`, `data-ops-production-closure.test.mjs`, `analytics-observability-closure.test.mjs`, `release-readiness-report.test.mjs`
- Fuel/Gas: `fuel-domain-closure.test.mjs`, `cross-domain-closure.test.mjs`, `analytics-observability-closure.test.mjs`, `release-readiness-report.test.mjs`
- Pharmacy OTC: `pharmacy-domain-closure.test.mjs`, `cross-domain-closure.test.mjs`, `analytics-observability-closure.test.mjs`, `release-readiness-report.test.mjs`
- Platform/admin/release: `data-ops-production-closure.test.mjs`, `analytics-observability-closure.test.mjs`, `release-readiness-report.test.mjs`, `scripts/ops/release-readiness-report.mjs`

Machine-readable source: `docs/release/domain-closure-matrix.json`.
