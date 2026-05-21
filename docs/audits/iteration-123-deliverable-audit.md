# Iteration 123 Deliverable Audit — Catalog Coverage Target Export Script

## Objective restatement

Provide an operational way to populate the required production `CATALOG_COVERAGE_TARGETS_JSON` from the live PostgreSQL catalog, so the all-products/all-stores coverage gate can be configured from actual product, store, and chain inventory evidence.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| Generate target product universe from DB | `scripts/ops/print-catalog-coverage-targets.mjs` queries `products` and emits `targetProducts`. | Implemented |
| Generate target store/branch universe from DB | Script queries `stores` and emits `targetStores`. | Implemented |
| Require all chains in exported targets | Script validates live `chains` contains ICA, Willys, Coop, Hemköp, Lidl, and City Gross and emits those six chain targets. | Implemented |
| Enforce product-store matrix mode | Script emits `requireEveryProductInEveryStore: true`. | Implemented |
| Operator command is discoverable | Root package script `ops:catalog-coverage-targets` runs the exporter. | Implemented |
| Script has local verification without DB | `--self-test` emits deterministic target JSON and schema test verifies it. | Verified |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk node --test tests/schema/catalog-coverage-targets-script.test.mjs` | Pass: 2 tests |
| `rtk npm run typecheck` | Pass |
| `rtk git diff --check` | Pass |

## Remaining gaps after this iteration

- An operator still has to run `DATABASE_URL=... npm run ops:catalog-coverage-targets` and store the emitted JSON in `CATALOG_COVERAGE_TARGETS_JSON` for production.
- The exporter derives targets from current DB inventory; if a chain/store/product is missing from the DB, ingestion/store discovery must fix that before exporting.
