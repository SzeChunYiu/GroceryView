# @groceryview/core

Pure TypeScript pricing, promotion, ranking, basket, privacy, and planning logic for GroceryView. This package has no network, filesystem, database, or browser I/O; callers pass fully shaped inputs and receive deterministic objects that API, server, ingestion, and UI packages can render or persist.

## Public exports

`src/index.ts` exports the core domain helpers and their input/result types, including:

- deal scoring: `calculateDealScore`, `calculateHistoricalDealScore`, `scoreBand`, `rankDealOpportunities`
- basket comparison and planning: `compareBasketAcrossStores`, `planBasketTripCost`, `planBasketFulfillmentSlots`, `planRetailerHandoff`, `planRetailerBasketTransferSession`
- basket import/export and review guardrails: `planBasketImportExport`, `summarizeBasketImportReview`, `basketImportReviewGuardrails`
- local offers, pantry, meal, expiry, watchlist, and notification planning helpers
- privacy/account helpers: `buildPrivacyExport`, `planPrivacyRequestFulfillment`, `planAccountDeletion`
- human-review and trust helpers: assignment, SLA, and decision utilities
- chain/index helpers: `calculateChainPriceIndex` and related typed inputs/results

The generated `dist/index.d.ts` is the import contract for consumers.

## Key files

- `src/index.ts` — single public implementation surface for pure core logic.
- `src/__tests__/*.test.ts` — focused node:test coverage for each domain cluster.
- `tsconfig.build.json` — production build configuration.
- `tsconfig.test.json` — test compilation configuration.

## Usage example

```ts
import { calculateDealScore, scoreBand } from '@groceryview/core';

const score = calculateDealScore({
  currentCityPercentile: 10,
  knownPromoHistoryPercentile: 15,
  equivalentUnitPricePercentile: 20,
  discountDepthPercent: 25,
  sourceConfidence: 0.9
});

const band = scoreBand(score);
// band => { label: 'Good deal', verdict: 'Buy' } for this input range
```

## Rules for new core code

- Keep logic pure and deterministic; do not import runtime clients or read environment variables.
- Add or update `node:test` coverage next to the relevant domain tests.
- Prefer explicit input and result types so API and UI packages can serialize outputs without guessing.
- Keep source confidence, freshness, and privacy guardrails in returned objects when they affect user-facing claims.
