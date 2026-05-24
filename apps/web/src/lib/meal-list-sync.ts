import { dealBasedMeals, familyMealPlannerFromDeals, freezerBatchCookPlanner, studentDealRecipes } from '@/lib/demo-data';

export const MEAL_LIST_SYNC_STORAGE_KEY = 'groceryview:meal-list-sync:selected-plan-ids';
export const MEAL_LIST_SYNC_EVENT = 'groceryview:meal-list-sync';

export type MealListSyncIngredient = {
  productId?: string;
  name: string;
  category?: string;
};

export type MealListSyncPlan = {
  id: string;
  title: string;
  source: string;
  ingredients: MealListSyncIngredient[];
};

export type MealListSyncDelta = {
  id: string;
  name: string;
  category?: string;
  mealTitles: string[];
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function cleanIngredients(ingredients: Array<MealListSyncIngredient | null | undefined>) {
  return ingredients.filter((ingredient): ingredient is MealListSyncIngredient => Boolean(ingredient?.name));
}

export const mealListSyncPlans: MealListSyncPlan[] = [
  ...dealBasedMeals.suggestions.map((meal) => ({
    id: `deal-${slug(meal.title)}`,
    title: meal.title,
    source: 'Suggested deal meals',
    ingredients: cleanIngredients(meal.ingredients),
  })),
  ...studentDealRecipes.recipes.map((recipe) => ({
    id: `student-${slug(recipe.title)}`,
    title: recipe.title,
    source: studentDealRecipes.persona,
    ingredients: cleanIngredients(recipe.ingredients),
  })),
  ...familyMealPlannerFromDeals.meals.map((meal) => ({
    id: `family-${slug(meal.weeknightSlot)}-${slug(meal.title)}`,
    title: `${meal.weeknightSlot}: ${meal.title}`,
    source: familyMealPlannerFromDeals.persona,
    ingredients: cleanIngredients(meal.ingredients),
  })),
  ...freezerBatchCookPlanner.meals.map((meal) => ({
    id: `freezer-${slug(meal.title)}`,
    title: meal.title,
    source: freezerBatchCookPlanner.persona,
    ingredients: cleanIngredients(meal.ingredients),
  })),
];

export function getMealListDeltas(selectedPlanIds: string[], plans = mealListSyncPlans): MealListSyncDelta[] {
  const selected = new Set(selectedPlanIds);
  const deltas = new Map<string, MealListSyncDelta>();

  plans.filter((plan) => selected.has(plan.id)).forEach((plan) => {
    plan.ingredients.forEach((ingredient) => {
      const id = ingredient.productId || slug(ingredient.name);
      const existing = deltas.get(id);

      if (existing) {
        if (!existing.mealTitles.includes(plan.title)) {
          existing.mealTitles.push(plan.title);
        }
        return;
      }

      deltas.set(id, {
        id,
        name: ingredient.name,
        category: ingredient.category,
        mealTitles: [plan.title],
      });
    });
  });

  return Array.from(deltas.values()).sort((a, b) => a.name.localeCompare(b.name, 'sv'));
}

export function readMealListSyncSelection() {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed = JSON.parse(window.localStorage.getItem(MEAL_LIST_SYNC_STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}
