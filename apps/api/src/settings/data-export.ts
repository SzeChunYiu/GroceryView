import { buildPrivacyExport } from '@groceryview/core';
import { groceryApi } from '../demo-data.js';

export const demoDataExportGeneratedAt = '2026-05-20T12:00:00.000Z';

export function buildDemoUserDataExport() {
  const userId = 'demo';
  const householdPlan = groceryApi.getHouseholdPlan(userId);
  const watchlist = groceryApi.getWatchlist(userId);
  const budgetSummary = groceryApi.getBudgetSummary(userId);
  const alerts = watchlist.items
    .filter((item) => item.targetPrice !== undefined || item.alertDealScoreAt !== undefined)
    .map((item) => ({
      productId: item.productId,
      ...(item.targetPrice === undefined ? {} : { targetPrice: item.targetPrice }),
      ...(item.alertDealScoreAt === undefined ? {} : { alertDealScoreAt: item.alertDealScoreAt }),
      favoriteStoresOnly: item.favoriteStoresOnly ?? false,
      allowedPriceTypes: item.allowedPriceTypes ?? []
    }));
  const preferences = budgetSummary.weeklyBudget > 0 || budgetSummary.monthlyBudget > 0
    ? [{ weeklyBudget: budgetSummary.weeklyBudget, monthlyBudget: budgetSummary.monthlyBudget }]
    : [];

  return {
    ...buildPrivacyExport(
      {
        userId,
        lists: [{ id: 'current_basket', items: groceryApi.getBasket(userId).items }],
        alerts,
        preferences,
        analyticsEvents: [],
        favoriteStoreIds: groceryApi.getFavoriteStores(userId).map((store) => store.id),
        watchlistProductIds: watchlist.items.map((item) => item.productId),
        receiptIds: [],
        householdIds: householdPlan ? [householdPlan.household.id] : []
      },
      demoDataExportGeneratedAt
    ),
    demo: true
  };
}
