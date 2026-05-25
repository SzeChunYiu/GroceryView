import type { PantryItemRecord } from '@groceryview/db';
import type { PantryDeal } from '@groceryview/core';
import type { MealBudgetIngredient, MealBudgetPlan } from './meal-budgets';

export type PantryStockStatus = 'healthy' | 'low' | 'depleted';

export type PantryExpiryUrgency = 'expired' | 'use-soon' | 'planned' | 'unknown';

export type PantryExpiryReminder = {
  daysUntilExpiry: number | null;
  label: string;
  urgency: PantryExpiryUrgency;
};

export type PantryStockItem = {
  productId: string;
  name: string;
  unit: string;
  ownedQuantity: number;
  minimumQuantity: number;
  estimatedDailyUse: number;
  depletionEstimateDays: number | null;
  expiryReminder: PantryExpiryReminder;
  status: PantryStockStatus;
};

export type PantryConsumptionEvent = {
  productId: string;
  quantity: number;
  source: 'trip' | 'manual';
  label: string;
  occurredAt: string;
};

export type PantryReplacementFilter = {
  replacementId: string;
  label: string;
  categorySlug: string;
  keywords: string[];
};

export type PantryStatusRow = {
  productId: string;
  name: string;
  unit: string;
  remainingQuantity: number;
  minimumQuantity: number;
  daysUntilExpiry?: number | null;
  expiresAt?: string | null;
};

export type PantryDealEvidence = {
  productId: string;
  storeName: string;
  price: number;
  dealScore: number | null;
  href: string;
};

export type MealPlanGroceryListItem = {
  id: string;
  name: string;
  category: string;
  quantity: string;
  recipeCount: number;
  mealTitles: string[];
  source?: string;
};

export type MealPlanPantryExclusion = {
  productId: string;
  name: string;
  mealTitles: string[];
  reason: string;
};

export type MealPlanGroceryExport = {
  selectedMealTitles: string[];
  items: MealPlanGroceryListItem[];
  excludedPantryItems: MealPlanPantryExclusion[];
};

const pantryReplacementFilters: Record<string, Omit<PantryReplacementFilter, 'replacementId'>> = {
  coffee: {
    label: 'Coffee',
    categorySlug: 'coffee-tea',
    keywords: ['coffee', 'kaffe']
  },
  oats: {
    label: 'Oats',
    categorySlug: 'breakfast',
    keywords: ['oats', 'havre', 'havregryn']
  },
  milk: {
    label: 'Milk or fil',
    categorySlug: 'dairy',
    keywords: ['milk', 'mjolk', 'fil', 'yoghurt']
  },
  'frozen-veg': {
    label: 'Frozen vegetables',
    categorySlug: 'frozen',
    keywords: ['frozen', 'vegetable', 'vegetables', 'gronsak', 'wokmix']
  }
};

function normalizeReplacementText(value: string) {
  return value
    .toLowerCase()
    .replace(/å/g, 'a')
    .replace(/ä/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function labelFromReplacementToken(token: string) {
  return token.split('-').filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
}

export function buildPantryReplacementFilter(value: string | string[] | undefined): PantryReplacementFilter | null {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const replacementId = rawValue ? normalizeReplacementText(rawValue) : '';
  if (!replacementId) return null;

  const knownFilter = pantryReplacementFilters[replacementId];
  if (knownFilter) {
    return { replacementId, ...knownFilter };
  }

  return {
    replacementId,
    label: labelFromReplacementToken(replacementId),
    categorySlug: replacementId,
    keywords: replacementId.split('-').filter(Boolean)
  };
}

export function pantryReplacementMatches(
  filter: PantryReplacementFilter,
  row: { productName: string; productSlug: string; categoryLabel?: string; categorySlug?: string }
) {
  if (row.categorySlug === filter.categorySlug) return true;

  const searchableText = [
    row.productName,
    row.productSlug,
    row.categoryLabel,
    row.categorySlug
  ].filter(Boolean).map((part) => normalizeReplacementText(String(part))).join(' ');

  return filter.keywords.some((keyword) => searchableText.includes(normalizeReplacementText(keyword)));
}

function roundQuantity(value: number) {
  return Math.round(Math.max(0, value) * 100) / 100;
}

function estimateDailyUse(row: PantryStatusRow) {
  const buffer = Math.max(row.remainingQuantity - row.minimumQuantity, row.minimumQuantity);
  return roundQuantity(Math.max(buffer / 7, 0.25));
}

export function estimateDepletionDays(ownedQuantity: number, estimatedDailyUse: number) {
  if (ownedQuantity <= 0) return 0;
  if (estimatedDailyUse <= 0) return null;
  return Math.ceil(ownedQuantity / estimatedDailyUse);
}

export function buildExpiryReminder(row: Pick<PantryStatusRow, 'daysUntilExpiry' | 'expiresAt'>): PantryExpiryReminder {
  const daysUntilExpiry = row.expiresAt
    ? Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 86_400_000)
    : typeof row.daysUntilExpiry === 'number'
      ? Math.ceil(row.daysUntilExpiry)
      : null;

  if (daysUntilExpiry === null || !Number.isFinite(daysUntilExpiry)) {
    return { daysUntilExpiry: null, label: 'No expiry date tracked', urgency: 'unknown' };
  }

  if (daysUntilExpiry < 0) return { daysUntilExpiry, label: `Expired ${Math.abs(daysUntilExpiry)} days ago`, urgency: 'expired' };
  if (daysUntilExpiry === 0) return { daysUntilExpiry, label: 'Expires today', urgency: 'expired' };
  if (daysUntilExpiry <= 7) return { daysUntilExpiry, label: `Use within ${daysUntilExpiry} days`, urgency: 'use-soon' };
  return { daysUntilExpiry, label: `Expires in ${daysUntilExpiry} days`, urgency: 'planned' };
}

function getStockStatus(ownedQuantity: number, minimumQuantity: number): PantryStockStatus {
  if (ownedQuantity <= 0) return 'depleted';
  if (ownedQuantity <= minimumQuantity) return 'low';
  return 'healthy';
}

export function pantryStatusRowsFromAccountInventory(items: PantryItemRecord[]): PantryStatusRow[] {
  return items.map((item) => ({
    productId: item.productId,
    name: item.name,
    unit: item.unit,
    remainingQuantity: item.quantity,
    minimumQuantity: item.minimumQuantity,
    expiresAt: item.expiresOn ?? null
  }));
}

export function buildPantryStockItems(rows: PantryStatusRow[]): PantryStockItem[] {
  return rows.map((row) => {
    const ownedQuantity = roundQuantity(row.remainingQuantity);
    const estimatedDailyUse = estimateDailyUse(row);

    return {
      productId: row.productId,
      name: row.name,
      unit: row.unit,
      ownedQuantity,
      minimumQuantity: row.minimumQuantity,
      estimatedDailyUse,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, estimatedDailyUse),
      expiryReminder: buildExpiryReminder(row),
      status: getStockStatus(ownedQuantity, row.minimumQuantity)
    };
  });
}

export function applyPantryConsumptionEvents(items: PantryStockItem[], events: PantryConsumptionEvent[]) {
  const consumedByProduct = events.reduce<Record<string, number>>((acc, event) => {
    acc[event.productId] = (acc[event.productId] ?? 0) + Math.max(0, event.quantity);
    return acc;
  }, {});

  return items.map((item) => {
    const ownedQuantity = roundQuantity(item.ownedQuantity - (consumedByProduct[item.productId] ?? 0));

    return {
      ...item,
      ownedQuantity,
      depletionEstimateDays: estimateDepletionDays(ownedQuantity, item.estimatedDailyUse),
      status: getStockStatus(ownedQuantity, item.minimumQuantity)
    };
  });
}

export function buildPantryDealEvidence(
  deals: readonly PantryDeal[],
  productId: string,
  href = `/deals?replace=${encodeURIComponent(productId)}`
): PantryDealEvidence | null {
  const bestDeal = deals
    .filter((deal) => deal.productId === productId && deal.storeName.trim().length > 0 && Number.isFinite(deal.price))
    .sort((left, right) => {
      const scoreDelta = (right.dealScore ?? 0) - (left.dealScore ?? 0);
      return scoreDelta === 0 ? left.price - right.price : scoreDelta;
    })[0];

  if (!bestDeal) {
    return null;
  }

  return {
    productId,
    storeName: bestDeal.storeName,
    price: bestDeal.price,
    dealScore: bestDeal.dealScore ?? null,
    href
  };
}

export function buildPantryDealEvidenceMap(
  deals: readonly PantryDeal[],
  productHrefs: Readonly<Record<string, string>>
) {
  return Object.fromEntries(
    Object.entries(productHrefs)
      .map(([productId, href]) => [productId, buildPantryDealEvidence(deals, productId, href)] as const)
      .filter((entry): entry is readonly [string, PantryDealEvidence] => entry[1] !== null)
  );
}

function ingredientKey(ingredient: MealBudgetIngredient) {
  return ingredient.productId ?? normalizeReplacementText(ingredient.name);
}

function quantityLabel(recipeCount: number) {
  return `${recipeCount} recipe${recipeCount === 1 ? '' : 's'}`;
}

export function buildMealPlanGroceryExport(
  mealPlans: readonly MealBudgetPlan[],
  selectedMealTitles: readonly string[],
  pantryProductIds: readonly string[] = []
): MealPlanGroceryExport {
  const selectedSet = new Set(selectedMealTitles);
  const pantrySet = new Set(pantryProductIds);
  const items = new Map<string, MealPlanGroceryListItem>();
  const excludedPantryItems = new Map<string, MealPlanPantryExclusion>();

  for (const meal of mealPlans) {
    if (!selectedSet.has(meal.title)) continue;

    for (const ingredient of meal.ingredients) {
      if (!ingredient) continue;

      const key = ingredientKey(ingredient);
      if (ingredient.productId && pantrySet.has(ingredient.productId)) {
        const excluded = excludedPantryItems.get(ingredient.productId) ?? {
          productId: ingredient.productId,
          name: ingredient.name,
          mealTitles: [],
          reason: 'Already covered by pantry inventory above the restock threshold.'
        };

        excluded.mealTitles.push(meal.title);
        excludedPantryItems.set(ingredient.productId, excluded);
        continue;
      }

      const current = items.get(key) ?? {
        id: key,
        name: ingredient.name,
        category: ingredient.category,
        quantity: '',
        recipeCount: 0,
        mealTitles: [],
        source: ingredient.source
      };

      current.recipeCount += 1;
      current.quantity = quantityLabel(current.recipeCount);
      current.mealTitles.push(meal.title);
      items.set(key, current);
    }
  }

  return {
    selectedMealTitles: selectedMealTitles.filter((title) => selectedSet.has(title)),
    items: Array.from(items.values()).sort((left, right) => left.name.localeCompare(right.name)),
    excludedPantryItems: Array.from(excludedPantryItems.values()).sort((left, right) =>
      left.name.localeCompare(right.name)
    )
  };
}
