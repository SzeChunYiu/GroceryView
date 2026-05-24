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
