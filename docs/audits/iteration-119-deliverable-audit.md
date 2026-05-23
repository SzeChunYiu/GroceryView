# Iteration 119 Deliverable Audit — Runtime Catalog Coverage Provider

## Objective restatement

Make the deployed catalog coverage readiness endpoint executable from production configuration and PostgreSQL evidence, so it can evaluate configured product/category/chain/store targets against live `latest_prices` coverage rows.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Runtime target inventories can be configured | `CATALOG_COVERAGE_TARGETS_JSON` is parsed into target products, categories, chains, stores, and product-store matrix mode. | Implemented |
| Invalid target configuration fails closed | Runtime parser rejects missing/non-string/empty target arrays. | Implemented |
| Runtime provider reads live DB coverage rows | `createRuntimeRepositoryResource` wires `createPostgresCatalogReader(...).listProductCoverageRows()` into `buildCatalogCoverageReport`. | Implemented |
| Deployed endpoint can evaluate configured targets | Runtime test calls `/api/readiness/catalog-coverage` with metrics token and verifies a live DB-derived product-store gap returns 503. | Verified |
| Secrets and DB errors stay redacted | Existing endpoint error handling remains fail-closed with `catalog_coverage_probe_failed`. | Preserved |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/server` | Pass: 54 tests |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- Production must populate `CATALOG_COVERAGE_TARGETS_JSON` with the actual target product/store universe.
- The daily workflow still needs to call `/api/readiness/catalog-coverage` after ingestion to enforce this new runtime gate every day.
