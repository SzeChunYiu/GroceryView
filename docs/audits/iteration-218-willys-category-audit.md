# Iteration 218 Willys category ingestion audit

Date: 2026-05-24

## Scope

- Source: Willys public category JSON and Axfood campaign JSON.
- Changed files:
  - `packages/ingestion/src/connectors/willys.ts`
  - `apps/web/src/lib/ingested/willys.ts`
  - `scripts/ingestion/generate-live-retailer-ingested.mjs`

## Real-source checks

- `curl -L -A "GroceryView/0.1" https://www.willys.se/leftMenu/categorytree`
  - Result: HTTP 200 JSON, 19 top-level category children.
- `curl -L -A "GroceryView/0.1" "https://www.willys.se/c/kott-chark-och-fagel?page=0&size=100"`
  - Result: HTTP 200 JSON, 100 product rows.
  - First inspected row: `101860922_ST`, `Kyckling Bröstfilé`, `56,68 kr`.

The generic `https://www.willys.se/c` page returned HTTP 403 from CloudFront and was not used as a data source.

## Row-count evidence

- Previous `apps/web/src/lib/ingested/willys.ts` product snapshot: 516 rows from search URLs.
- New Willys product snapshot: 1,200 rows from 13 category page URLs.
- Existing Willys weekly discounts retained: 44,241 rows.
- `willysSource.rowCount` equals `willysProducts.length`.
- All product rows have `sourceUrl` and `retrievedAt`.

## Verification

- `npm run ingest:verify`: passed.
- `npm run test -w @groceryview/ingestion`: passed, 181 tests.
- `npm run build`: passed.
- `npm run typecheck`: passed.
- `git diff --check`: passed before commit.

## Worker coordination note

Four source assignments were attempted for the manager round. Available worker agents failed with usage-limit errors before returning artifacts, so no worker output was accepted. This PR includes only locally verified Willys rows from public cited sources.
