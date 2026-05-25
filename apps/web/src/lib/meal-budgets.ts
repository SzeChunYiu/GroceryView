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
