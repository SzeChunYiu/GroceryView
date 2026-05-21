# Iteration 116 Deliverable Audit — Product-by-Store Catalog Coverage

## Objective restatement

Move the catalog coverage gate closer to the objective of all products from all stores/branches by making product completeness and product-by-store completeness first-class coverage dimensions, not only category/chain/store presence.

## Prompt-to-artifact checklist

| Requirement / deliverable | Evidence | Status |
| --- | --- | --- |
| All products can be checked | `CatalogCoverageInput.targetProducts` and `coverage.products` compare observed product IDs against the required product universe. | Implemented |
| All stores / branches can be checked | Existing `targetStores` coverage is preserved and now participates in product-store matrix checks. | Preserved |
| All products from all stores can be checked | `requireEveryProductInEveryStore` produces `missingProductStorePairs` and `backfill_product_store_pairs:<count>` actions when any target product lacks a target-store price. | Implemented |
| Existing category/chain/store gates still work | Existing coverage dimensions remain unchanged and tests still verify category, chain, and store gaps. | Verified |
| Completion is not overclaimed | This is a verifier capability; actual full completeness still requires source-specific target product/store inventories and observed DB rows. | Explicitly incomplete |

## Verification evidence

| Command | Result |
| --- | --- |
| `rtk npm run test -w @groceryview/catalog` | Pass: 5 tests |

## Remaining gaps after this iteration

- The code can now represent and fail product-by-store coverage gaps, but production still needs generated target inventories for every chain/store and observed coverage reports from the live database.
- Chain-wide sources such as Axfood cannot prove per-branch shelf prices by themselves; branch-level proof still needs per-branch APIs, regional feeds, or receipt/shelf evidence.
