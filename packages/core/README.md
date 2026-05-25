# @groceryview/core

Pure TypeScript pricing, promotion, basket, alert, and ranking logic for GroceryView. The package has no I/O side effects: callers pass verified inputs in and receive deterministic plans, scores, summaries, or ranked rows out. Browser apps, APIs, jobs, and tests can import it without database, network, filesystem, or framework dependencies.

## Public exports

The public surface is `src/index.ts`.

### Re-exported modules

- `./lib/rankers/nearby.js` — nearby store/product ranking helpers.
- `./lib/rankers/premium.js` — premium-aware ranking helpers.
- `./lib/rankers/myBasket.js` — basket-personalized ranking helpers.
- `./lib/fuelRoute.js` — fuel route planning types and functions.
- `./lib/spendForecast.js` — household spend forecast types and functions.

### Scoring and ranking

- `calculateDealScore`, `scoreBand`, `calculateHistoricalDealScore`
- `rankDealOpportunities`, `suggestFriendSharedDeals`
- `calculateFixedBasketIndex`, `calculateBrandTierIndices`
- `summarizeCategoryDealLeaders`, `searchProducts`
- `buildWatchlistAlerts`, `summarizeBudget`

### Basket, fulfilment, and trips

- `compareBasketStrategies`, `summarizeStoreBasketCoverage`
- `planMultiWeekStockUpList`, `validateBasketComparisonLineFixtures`
- `planBasketFulfillmentSlots`, `planBasketImportExport`
- `planRetailerBasketTransferSession`, `planRetailerHandoff`
- `scoreRetailerDeepLinkQuality`, `planBasketTripCost`
- `summarizeLocalOfferBasket`, `planRecurringBasketDigest`

### Price history, substitutions, and commodities

- `priceChartLineStyle`, `summarizePriceHistory`
- `summarizePriceHistoryConfidence`, `buildPriceChartSeries`
- `classifyProductMatch`, `recommendSmartSwaps`
- `planStockoutSubstitutionOptions`, `planDietarySubstitutionAssistant`
- `compareCommodityUnitPrices`

### Alerts, notifications, and review queues

- `groceryAlertChannelDefaults`, `planGroceryAlertChannelDefault`
- `planNotifications`
- Human/community review queue and assignment helpers exported from `src/index.ts`.

The package also exports the TypeScript input/output types used by those functions, including deal-score, basket, price-history, watchlist, notification, matching, substitution, commodity, and human-review types.

## Key files

- `src/index.ts` — public API and most pure pricing, basket, alert, matching, and review logic.
- `src/lib/rankers/nearby.ts` — nearby ranking utilities.
- `src/lib/rankers/premium.ts` — premium-aware ranking utilities.
- `src/lib/rankers/myBasket.ts` — basket-personalized ranking utilities.
- `src/lib/fuelRoute.ts` — route-aware fuel planning.
- `src/lib/spendForecast.ts` — spend forecasting.
- `src/lib/basketBenchmark.ts` — basket benchmark calculations.
- `src/lib/coordinatedPriceMovement.ts` — coordinated price movement helpers.
- `src/lib/loyaltyROI.ts` — loyalty return-on-investment helpers.
- `src/__tests__/` — node test coverage for the pure functions.

## Usage example

```ts
import { calculateDealScore, scoreBand } from '@groceryview/core';

const score = calculateDealScore({
  currentCityPercentile: 12,
  knownPromoHistoryPercentile: 18,
  equivalentUnitPricePercentile: 20,
  discountDepthPercent: 25,
  sourceConfidence: 0.92
});

const band = scoreBand(score);
console.log(score, band.verdict);
```

Keep new exports pure and deterministic. If a feature needs database rows, HTTP, clock access, or framework APIs, do that work outside this package and pass normalized values into `@groceryview/core`.
