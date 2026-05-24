export type MealBudgetRecipe = {
  id?: string;
  title?: string;
  estimatedCost?: number;
  cost?: number;
  [key: string]: unknown;
};

export type RankedMealRecipe = MealBudgetRecipe & {
  estimatedCost: number;
  overBudget: boolean;
  budgetDelta: number;
};

export type AdaptiveMealBudgetInput = {
  weeklyBudget: number;
  spentToDate?: number;
  spentSoFar?: number;
  mealsRemaining: number;
  reserveTarget?: number;
  reserve?: number;
  recipes?: MealBudgetRecipe[];
};

export type AdaptiveMealBudgetEstimate = {
  weeklyBudget: number;
  spentToDate: number;
  mealsRemaining: number;
  remainingBudget: number;
  protectedReserve: number;
  spendableBudget: number;
  perMealBudget: number;
  recipes: RankedMealRecipe[];
};

function assertNonNegativeFinite(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative finite number`);
  }
  return value;
}

function normalizeRecipeCost(recipe: MealBudgetRecipe, index: number): number {
  const cost = recipe.estimatedCost ?? recipe.cost;
  return assertNonNegativeFinite(cost, `recipes[${index}].estimatedCost`);
}

export function clampAdaptiveMealReserve(remainingBudget: number, reserveTarget: number): number {
  const remaining = assertNonNegativeFinite(remainingBudget, 'remainingBudget');
  const target = assertNonNegativeFinite(reserveTarget, 'reserveTarget');
  return Math.min(remaining, target);
}

export function rankRecipesForAdaptiveBudget(recipes: MealBudgetRecipe[], perMealBudget: number): RankedMealRecipe[] {
  const budget = assertNonNegativeFinite(perMealBudget, 'perMealBudget');

  return recipes
    .map((recipe, index) => {
      const estimatedCost = normalizeRecipeCost(recipe, index);
      const overBudget = estimatedCost > budget;

      return {
        ...recipe,
        estimatedCost,
        overBudget,
        budgetDelta: budget - estimatedCost,
        originalIndex: index
      };
    })
    .sort((a, b) => Number(a.overBudget) - Number(b.overBudget)
      || a.estimatedCost - b.estimatedCost
      || a.originalIndex - b.originalIndex)
    .map(({ originalIndex: _originalIndex, ...recipe }) => recipe);
}

export function estimateAdaptiveMealBudget(input: AdaptiveMealBudgetInput): AdaptiveMealBudgetEstimate {
  const weeklyBudget = assertNonNegativeFinite(input.weeklyBudget, 'weeklyBudget');
  const spentToDate = assertNonNegativeFinite(input.spentToDate ?? input.spentSoFar ?? 0, 'spentToDate');
  const mealsRemaining = assertNonNegativeFinite(input.mealsRemaining, 'mealsRemaining');
  const reserveTarget = assertNonNegativeFinite(input.reserveTarget ?? input.reserve ?? 0, 'reserveTarget');

  if (!Number.isInteger(mealsRemaining)) {
    throw new RangeError('mealsRemaining must be a whole number');
  }

  const remainingBudget = Math.max(0, weeklyBudget - spentToDate);
  const protectedReserve = clampAdaptiveMealReserve(remainingBudget, reserveTarget);
  const spendableBudget = Math.max(0, remainingBudget - protectedReserve);
  const perMealBudget = mealsRemaining === 0 ? 0 : spendableBudget / mealsRemaining;

  return {
    weeklyBudget,
    spentToDate,
    mealsRemaining,
    remainingBudget,
    protectedReserve,
    spendableBudget,
    perMealBudget,
    recipes: rankRecipesForAdaptiveBudget(input.recipes ?? [], perMealBudget)
  };
}
