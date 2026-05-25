# @groceryview/core

Pure TypeScript grocery pricing, promotion, basket, ranking, matching, and notification logic shared by GroceryView apps. The package has no runtime I/O: callers pass verified observations, basket rows, or product fixtures in and receive deterministic plans, scores, summaries, and review decisions back. Browser apps, APIs, jobs, and tests can import it without database, network, filesystem, or framework dependencies.

## Install/import

```ts
import { calculateDealScore, scoreBand, compareBasketStrategies } from '@groceryview/core';
```

## Public exports

`src/index.ts` is the public surface. It re-exports these focused ranker/helper modules:

- `./lib/rankers/nearby.js`
- `./lib/rankers/premium.js`
- `./lib/rankers/myBasket.js`
- `./lib/fuelRoute.js`
- `./lib/spendForecast.js`
- `./lib/extractors/loosePacked.js`
- `./lib/loyaltyROI.js`

The root module also exports the following primary functions and constants:

- Deal scoring: `calculateDealScore`, `scoreBand`, `calculateHistoricalDealScore`, `rankDealOpportunities`, `suggestFriendSharedDeals`
- Basket planning: `compareBasketStrategies`, `summarizeStoreBasketCoverage`, `planMultiWeekStockUpList`, `validateBasketComparisonLineFixtures`, `summarizeLocalOfferBasket`, `planRecurringBasketDigest`, `planBasketTripCost`, `planBasketFulfillmentSlots`, `planBasketImportExport`, `planRetailerBasketTransferSession`, `planRetailerHandoff`, `scoreRetailerDeepLinkQuality`
- Price history and indices: `calculateFixedBasketIndex`, `summarizePriceHistory`, `summarizePriceHistoryConfidence`, `buildPriceChartSeries`, `priceChartLineStyle`, `calculateBrandTierIndices`
- Search, alerts, and budget: `searchProducts`, `summarizeCategoryDealLeaders`, `buildWatchlistAlerts`, `summarizeBudget`, `groceryAlertChannelDefaults`, `planGroceryAlertChannelDefault`, `planNotifications`
- Product matching and substitutions: `classifyProductMatch`, `recommendSmartSwaps`, `planStockoutSubstitutionOptions`, `planDietarySubstitutionAssistant`, `compareCommodityUnitPrices`
- Human review and receipt workflows: `planHumanReviewQueue`, `planCommunityReportAbuseControls`, `authorizeHumanReviewAction`, `planHumanReviewAssignments`, `summarizeHumanReviewSla`, `applyHumanReviewDecision`, `reviewReceiptScan`
- Household, pantry, meals, and privacy: `createHouseholdState`, `summarizeHousehold`, `planShareableHouseholdList`, `planPantryReplenishment`, `applyAdPolicy`, `rankOrganicDeals`, `rankNutritionPerKrona`, `suggestDealBasedMeals`, `calculateMealCostBreakdown`, `buildExpiryDealRadar`, `buildPrivacyExport`, `planAccountDeletion`, `planPrivacyRequestFulfillment`, `redactForAdvertisers`, `calculatePersonalGroceryInflation`, `calculateChainPriceIndex`

Types exported from the root include the input/output contracts for those functions, including `DealScoreInput`, `ScoreBand`, `HistoricalDealScoreInput`, `BasketComparisonInput`, `BasketComparisonResult`, `PriceHistoryPoint`, `PriceHistorySummary`, `SearchableProduct`, `WatchlistAlert`, `BudgetSummary`, `ProductMatchInput`, `SmartSwapRecommendation`, `StockoutSubstitutionPlan`, `DietarySubstitutionAssistantPlan`, `HumanReviewQueueItem`, and `ReceiptReview`.

## Key files

- `src/index.ts` — package entry point and public API definitions.
- `src/lib/rankers/` — composable ranking logic for nearby offers, premium value, payday timing, unit-price beaters, and My Basket personalization.
- `src/lib/basketBenchmark.ts` — basket comparison, coverage, trip-cost, stock-up, handoff, and recurring-basket planning.
- `src/lib/spendForecast.ts` — pure spend forecasting helpers re-exported by the package.
- `src/lib/fuelRoute.ts` — route/fuel adjustment helpers re-exported by the package.
- `src/lib/extractors/` — pure product text extractors such as loose-packed produce parsing.
- `src/lib/loyaltyROI.ts` — loyalty return-on-investment helpers re-exported by the package.
- `src/__tests__/` and `src/lib/__tests__/` — contract tests that exercise the public logic without network or filesystem dependencies.

## Usage example

```ts
import { calculateDealScore, scoreBand, compareBasketStrategies } from '@groceryview/core';

const score = calculateDealScore({
  currentCityPercentile: 18,
  knownPromoHistoryPercentile: 25,
  equivalentUnitPricePercentile: 20,
  discountDepthPercent: 30,
  sourceConfidence: 0.9
});

console.log(scoreBand(score));

const comparison = compareBasketStrategies({
  favoriteStoreIds: ['ica-nearby'],
  items: [
    {
      productId: 'milk',
      quantity: 1,
      prices: [
        { storeId: 'ica-nearby', storeName: 'ICA Nearby', price: 18.9 },
        { storeId: 'willys-town', storeName: 'Willys Town', price: 16.9 }
      ]
    }
  ]
});

console.log(comparison.bestSingleStore?.storeId);
```

## Design constraints

- Keep logic pure and deterministic; do not add fetch, database, filesystem, or browser storage access here.
- Prefer adding explicit input/output types next to exported functions.
- Re-export new public helpers through `src/index.ts` only when they are stable enough for app packages.
