export type MealBudgetIngredient = {
  name: string;
  category: string;
  price: number;
  productId?: string;
  source?: string;
};

export type MealBudgetPlan = {
  title: string;
  ingredients: Array<MealBudgetIngredient | null | undefined>;
};

export type ExtractedMealIngredient = MealBudgetIngredient & {
  mealTitle: string;
};

export type BudgetAlternative = {
  mealTitle: string;
  ingredientName: string;
  category: string;
  currentPrice: number;
  alternativeName: string;
  alternativePrice: number;
  estimatedSavings: number;
  reason: string;
};

export type MealPlanShoppingListItem = {
  category: string;
  detail: string;
  id: string;
  name: string;
  productId?: string;
  quantity: string;
};

export type MealPlanChainTotal = {
  chain: string;
  estimatedTotal: number;
  itemCount: number;
};

export type MealPlanShoppingListExport = {
  chainTotals: MealPlanChainTotal[];
  estimatedTotal: number;
  items: MealPlanShoppingListItem[];
  mealTitle: string;
  source: 'meal-planner';
};

export type WeeklyBudgetProgressStatus = 'empty' | 'under' | 'near' | 'over';

export type WeeklyBudgetProgressInput = {
  plannedTotal: number;
  weeklyBudget: number;
};

export type WeeklyBudgetProgress = {
  plannedTotal: number;
  weeklyBudget: number;
  remaining: number;
  percentUsed: number;
  status: WeeklyBudgetProgressStatus;
  warning: string;
};

export type WeeklyGroceryBudgetTrackerInput = {
  plannedBasketCost: number;
  actualCheckedItemsCost: number;
  weeklyAllowance: number;
  plannedItemCount?: number;
  checkedItemCount?: number;
};

export type WeeklyGroceryBudgetTracker = {
  plannedBasketCost: number;
  actualCheckedItemsCost: number;
  weeklyAllowance: number;
  plannedItemCount: number | null;
  checkedItemCount: number | null;
  remainingWeeklyAllowance: number;
  plannedRemainingAllowance: number;
  checkedSpendPercent: number;
  plannedSpendPercent: number;
  status: WeeklyBudgetProgressStatus;
  warning: string;
};

export type BasketBudgetItem = {
  id: string;
  name: string;
  category: string;
  currentPrice: number;
};

export type BasketBudgetAlternative = {
  productId: string;
  productName: string;
  category: string;
  currentPrice: number;
  alternativeProductId: string;
  alternativeName: string;
  alternativePrice: number;
  estimatedSavings: number;
  reason: string;
};

export function summarizeWeeklyBudgetProgress({ plannedTotal, weeklyBudget }: WeeklyBudgetProgressInput): WeeklyBudgetProgress {
  const safePlannedTotal = Math.max(0, Number.isFinite(plannedTotal) ? plannedTotal : 0);
  const safeWeeklyBudget = Math.max(0, Number.isFinite(weeklyBudget) ? weeklyBudget : 0);
  const remaining = safeWeeklyBudget - safePlannedTotal;
  const percentUsed = safeWeeklyBudget > 0 ? (safePlannedTotal / safeWeeklyBudget) * 100 : 0;
  const status: WeeklyBudgetProgressStatus = safePlannedTotal <= 0
    ? 'empty'
    : remaining < 0
      ? 'over'
      : percentUsed >= 85
        ? 'near'
        : 'under';
  const warning = status === 'over'
    ? 'This basket is over the weekly budget; review swaps before checkout.'
    : status === 'near'
      ? 'This basket is close to the weekly budget; cheaper swaps can protect the remaining buffer.'
      : status === 'empty'
        ? 'Select products to compare planned basket spend against the weekly budget.'
        : 'This basket is inside the weekly budget.';

  return {
    plannedTotal: safePlannedTotal,
    weeklyBudget: safeWeeklyBudget,
    remaining,
    percentUsed,
    status,
    warning
  };
}

export function summarizeWeeklyGroceryBudgetTracker({
  plannedBasketCost,
  actualCheckedItemsCost,
  weeklyAllowance,
  plannedItemCount,
  checkedItemCount
}: WeeklyGroceryBudgetTrackerInput): WeeklyGroceryBudgetTracker {
  const safePlannedBasketCost = Math.max(0, Number.isFinite(plannedBasketCost) ? plannedBasketCost : 0);
  const safeActualCheckedItemsCost = Math.max(0, Number.isFinite(actualCheckedItemsCost) ? actualCheckedItemsCost : 0);
  const safeWeeklyAllowance = Math.max(0, Number.isFinite(weeklyAllowance) ? weeklyAllowance : 0);
  const remainingWeeklyAllowance = safeWeeklyAllowance - safeActualCheckedItemsCost;
  const plannedRemainingAllowance = safeWeeklyAllowance - safePlannedBasketCost;
  const checkedSpendPercent = safeWeeklyAllowance > 0 ? (safeActualCheckedItemsCost / safeWeeklyAllowance) * 100 : 0;
  const plannedSpendPercent = safeWeeklyAllowance > 0 ? (safePlannedBasketCost / safeWeeklyAllowance) * 100 : 0;
  const status: WeeklyBudgetProgressStatus = safeActualCheckedItemsCost <= 0
    ? 'empty'
    : remainingWeeklyAllowance < 0
      ? 'over'
      : checkedSpendPercent >= 85 || plannedRemainingAllowance < 0
        ? 'near'
        : 'under';
  const warning = status === 'over'
    ? 'Checked grocery items are already over the weekly allowance.'
    : status === 'near'
      ? 'Checked items or the planned basket are close to the weekly allowance.'
      : status === 'empty'
        ? 'Check off grocery items to compare actual spend with the weekly allowance.'
        : 'Checked grocery items are within the weekly allowance.';

  return {
    plannedBasketCost: safePlannedBasketCost,
    actualCheckedItemsCost: safeActualCheckedItemsCost,
    weeklyAllowance: safeWeeklyAllowance,
    plannedItemCount: typeof plannedItemCount === 'number' && Number.isFinite(plannedItemCount) ? Math.max(0, plannedItemCount) : null,
    checkedItemCount: typeof checkedItemCount === 'number' && Number.isFinite(checkedItemCount) ? Math.max(0, checkedItemCount) : null,
    remainingWeeklyAllowance,
    plannedRemainingAllowance,
    checkedSpendPercent,
    plannedSpendPercent,
    status,
    warning
  };
}

export function suggestCheaperBasketAlternatives(
  selectedItems: BasketBudgetItem[],
  candidateItems: BasketBudgetItem[]
): BasketBudgetAlternative[] {
  const cheapestByCategory = new Map<string, BasketBudgetItem>();

  for (const candidate of candidateItems) {
    if (!Number.isFinite(candidate.currentPrice) || candidate.currentPrice <= 0) continue;
    const cheapest = cheapestByCategory.get(candidate.category);
    if (!cheapest || candidate.currentPrice < cheapest.currentPrice) cheapestByCategory.set(candidate.category, candidate);
  }

  return selectedItems
    .map((item) => {
      const alternative = cheapestByCategory.get(item.category);
      if (!alternative || alternative.id === item.id || alternative.currentPrice >= item.currentPrice) return null;
      const estimatedSavings = item.currentPrice - alternative.currentPrice;
      if (estimatedSavings <= 0) return null;

      return {
        productId: item.id,
        productName: item.name,
        category: item.category,
        currentPrice: item.currentPrice,
        alternativeProductId: alternative.id,
        alternativeName: alternative.name,
        alternativePrice: alternative.currentPrice,
        estimatedSavings,
        reason: `Swap to the lowest priced ${item.category} item in the current basket catalogue.`
      } satisfies BasketBudgetAlternative;
    })
    .filter((alternative): alternative is BasketBudgetAlternative => Boolean(alternative))
    .sort((left, right) => right.estimatedSavings - left.estimatedSavings);
}

export function extractIngredientsFromMealPlans(mealPlans: MealBudgetPlan[]): ExtractedMealIngredient[] {
  return mealPlans.flatMap((meal) =>
    meal.ingredients
      .filter((ingredient): ingredient is MealBudgetIngredient => Boolean(ingredient))
      .map((ingredient) => ({ ...ingredient, mealTitle: meal.title }))
  );
}

export function suggestBudgetAlternativesFromMealPlans(mealPlans: MealBudgetPlan[]): BudgetAlternative[] {
  const ingredients = extractIngredientsFromMealPlans(mealPlans);
  const cheapestByCategory = new Map<string, ExtractedMealIngredient>();

  for (const ingredient of ingredients) {
    const cheapest = cheapestByCategory.get(ingredient.category);
    if (!cheapest || ingredient.price < cheapest.price) cheapestByCategory.set(ingredient.category, ingredient);
  }

  return ingredients
    .map((ingredient) => {
      const alternative = cheapestByCategory.get(ingredient.category);
      if (!alternative || alternative.name === ingredient.name || alternative.price >= ingredient.price) return null;
      const estimatedSavings = ingredient.price - alternative.price;
      if (estimatedSavings <= 0) return null;

      return {
        mealTitle: ingredient.mealTitle,
        ingredientName: ingredient.name,
        category: ingredient.category,
        currentPrice: ingredient.price,
        alternativeName: alternative.name,
        alternativePrice: alternative.price,
        estimatedSavings,
        reason: `Swap to the lowest priced ${ingredient.category} already found in planned meals.`
      } satisfies BudgetAlternative;
    })
    .filter((alternative): alternative is BudgetAlternative => Boolean(alternative))
    .sort((left, right) => right.estimatedSavings - left.estimatedSavings);
}

function mealPlanListItemSlug(value: string) {
  return value.toLocaleLowerCase('sv-SE').normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'ingredient';
}

function mealPlanListItemKey(ingredient: MealBudgetIngredient) {
  return ingredient.productId
    ? `product:${ingredient.productId}`
    : `plain:${ingredient.category}:${ingredient.name}`;
}

function mealPlanQuantityLabel(uses: number) {
  return `${uses} ${uses === 1 ? 'normalized recipe portion' : 'normalized recipe portions'}`;
}

export function buildMealPlanShoppingListItems(mealPlans: MealBudgetPlan[]): MealPlanShoppingListItem[] {
  const groupedIngredients = new Map<string, {
    category: string;
    mealTitles: Set<string>;
    name: string;
    productId?: string;
    sources: Set<string>;
    uses: number;
  }>();

  for (const meal of mealPlans) {
    for (const ingredient of meal.ingredients) {
      if (!ingredient) continue;
      const key = mealPlanListItemKey(ingredient);
      const existing = groupedIngredients.get(key);
      if (existing) {
        existing.mealTitles.add(meal.title);
        existing.uses += 1;
        if (ingredient.source) existing.sources.add(ingredient.source);
        continue;
      }

      groupedIngredients.set(key, {
        category: ingredient.category,
        mealTitles: new Set([meal.title]),
        name: ingredient.name,
        productId: ingredient.productId,
        sources: new Set(ingredient.source ? [ingredient.source] : []),
        uses: 1
      });
    }
  }

  return [...groupedIngredients.entries()]
    .map(([key, ingredient]) => {
      const mealTitles = [...ingredient.mealTitles];
      const sources = [...ingredient.sources];
      const detailParts = [
        `Category: ${ingredient.category}`,
        `Meal plan: ${mealTitles.join(', ')}`
      ];
      if (sources.length > 0) detailParts.push(`Source: ${sources.join(', ')}`);

      return {
        category: ingredient.category,
        detail: detailParts.join(' · '),
        id: `meal-plan-${mealPlanListItemSlug(key)}`,
        name: ingredient.name,
        productId: ingredient.productId,
        quantity: mealPlanQuantityLabel(ingredient.uses)
      } satisfies MealPlanShoppingListItem;
    })
    .sort((left, right) => left.category.localeCompare(right.category, 'sv-SE') || left.name.localeCompare(right.name, 'sv-SE'));
}

export function estimateMealPlanChainTotals(mealPlans: MealBudgetPlan[]): MealPlanChainTotal[] {
  const totals = new Map<string, MealPlanChainTotal>();
  const seen = new Set<string>();

  for (const meal of mealPlans) {
    for (const ingredient of meal.ingredients) {
      if (!ingredient || !Number.isFinite(ingredient.price) || ingredient.price <= 0) continue;
      const chain = ingredient.source || 'Visible deal pool';
      const key = `${chain}:${mealPlanListItemKey(ingredient)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const current = totals.get(chain) ?? { chain, estimatedTotal: 0, itemCount: 0 };
      current.estimatedTotal += ingredient.price;
      current.itemCount += 1;
      totals.set(chain, current);
    }
  }

  return [...totals.values()]
    .map((total) => ({ ...total, estimatedTotal: Number(total.estimatedTotal.toFixed(2)) }))
    .sort((left, right) => left.estimatedTotal - right.estimatedTotal || left.chain.localeCompare(right.chain, 'sv-SE'));
}

export function buildMealPlanShoppingListExport(mealPlans: MealBudgetPlan[], mealTitle: string): MealPlanShoppingListExport {
  const chainTotals = estimateMealPlanChainTotals(mealPlans);
  return {
    chainTotals,
    estimatedTotal: Number(chainTotals.reduce((sum, chain) => sum + chain.estimatedTotal, 0).toFixed(2)),
    items: buildMealPlanShoppingListItems(mealPlans),
    mealTitle,
    source: 'meal-planner'
  };
}

export function mealPlanShoppingListHref(mealPlans: MealBudgetPlan[], mealTitle: string) {
  return `/list?mealPlan=${encodeURIComponent(JSON.stringify(buildMealPlanShoppingListExport(mealPlans, mealTitle)))}`;
}

export function parseMealPlanShoppingListExport(value: string): MealPlanShoppingListExport | null {
  try {
    const parsed = JSON.parse(value) as MealPlanShoppingListExport | null;
    if (!parsed || parsed.source !== 'meal-planner' || typeof parsed.mealTitle !== 'string' || !Array.isArray(parsed.items)) return null;

    const items = parsed.items.filter((item): item is MealPlanShoppingListItem => (
      item !== null
      && typeof item === 'object'
      && typeof item.category === 'string'
      && typeof item.detail === 'string'
      && typeof item.id === 'string'
      && typeof item.name === 'string'
      && typeof item.quantity === 'string'
      && (item.productId === undefined || typeof item.productId === 'string')
    ));

    return {
      chainTotals: Array.isArray(parsed.chainTotals)
        ? parsed.chainTotals.filter((total): total is MealPlanChainTotal => (
          total !== null
          && typeof total === 'object'
          && typeof total.chain === 'string'
          && typeof total.estimatedTotal === 'number'
          && typeof total.itemCount === 'number'
        ))
        : [],
      estimatedTotal: typeof parsed.estimatedTotal === 'number' ? parsed.estimatedTotal : 0,
      items,
      mealTitle: parsed.mealTitle,
      source: 'meal-planner'
    };
  } catch {
    return null;
  }
}

export type BudgetCategoryBreakdownRow = {
  category: string;
  total: number;
  sharePct: number;
};

export function summarizeBudgetCategoryBreakdown(items: Array<{ category: string; currentPrice: number }>): BudgetCategoryBreakdownRow[] {
  const totals = new Map<string, number>();
  for (const item of items) {
    const price = Number.isFinite(item.currentPrice) ? Math.max(0, item.currentPrice) : 0;
    totals.set(item.category, (totals.get(item.category) ?? 0) + price);
  }
  const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total, sharePct: grandTotal > 0 ? (total / grandTotal) * 100 : 0 }))
    .sort((left, right) => right.total - left.total || left.category.localeCompare(right.category, 'sv-SE'));
}
