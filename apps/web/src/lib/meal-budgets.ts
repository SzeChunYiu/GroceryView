export type MealBudgetIngredient = {
  productId: string;
  name: string;
  category: string;
  price: number;
  dealScore?: number;
  source?: string;
};

export type MealBudgetPlan = {
  title: string;
  estimatedCost?: number;
  ingredients?: readonly (MealBudgetIngredient | null | undefined)[];
};

export type ExtractedMealIngredient = MealBudgetIngredient & {
  mealTitle: string;
  nutritionRole: 'protein' | 'produce' | 'pantry' | 'dairy' | 'general';
};

export type MealBudgetAlternative = {
  mealTitle: string;
  ingredientName: string;
  alternativeName: string;
  category: string;
  nutritionRole: ExtractedMealIngredient['nutritionRole'];
  currentPrice: number;
  alternativePrice: number;
  savings: number;
  reason: string;
};

function isMealBudgetIngredient(ingredient: MealBudgetIngredient | null | undefined): ingredient is MealBudgetIngredient {
  return Boolean(ingredient);
}

function nutritionRoleFor(ingredient: Pick<MealBudgetIngredient, 'category' | 'name'>): ExtractedMealIngredient['nutritionRole'] {
  const value = `${ingredient.category} ${ingredient.name}`.toLowerCase();

  if (/chicken|fish|salmon|beef|pork|tofu|bean|lentil|egg|protein/.test(value)) return 'protein';
  if (/vegetable|fruit|produce|broccoli|tomato|carrot|salad|pepper|onion|pea|spinach/.test(value)) return 'produce';
  if (/milk|yogurt|cheese|dairy/.test(value)) return 'dairy';
  if (/rice|pasta|bread|grain|oat|potato|pantry|noodle/.test(value)) return 'pantry';

  return 'general';
}

export function extractIngredientsFromMealPlans(mealPlans: readonly MealBudgetPlan[]): ExtractedMealIngredient[] {
  return mealPlans.flatMap((meal) =>
    (meal.ingredients ?? []).filter(isMealBudgetIngredient).map((ingredient) => ({
      ...ingredient,
      mealTitle: meal.title,
      nutritionRole: nutritionRoleFor(ingredient),
    })),
  );
}

export function suggestBudgetAlternatives(
  mealPlans: readonly MealBudgetPlan[],
  options: { maxAlternatives?: number } = {},
): MealBudgetAlternative[] {
  const ingredients = extractIngredientsFromMealPlans(mealPlans);
  const maxAlternatives = options.maxAlternatives ?? 6;

  return ingredients
    .map((ingredient) => {
      const alternative = ingredients
        .filter((candidate) =>
          candidate.productId !== ingredient.productId &&
          candidate.category === ingredient.category &&
          candidate.nutritionRole === ingredient.nutritionRole &&
          candidate.price < ingredient.price,
        )
        .sort((a, b) => a.price - b.price || (b.dealScore ?? 0) - (a.dealScore ?? 0))[0];

      if (!alternative) return null;

      const savings = ingredient.price - alternative.price;

      return {
        mealTitle: ingredient.mealTitle,
        ingredientName: ingredient.name,
        alternativeName: alternative.name,
        category: ingredient.category,
        nutritionRole: ingredient.nutritionRole,
        currentPrice: ingredient.price,
        alternativePrice: alternative.price,
        savings,
        reason: `Same ${ingredient.nutritionRole} role and ${ingredient.category} category with ${savings.toFixed(2)} SEK lower visible price.`,
      } satisfies MealBudgetAlternative;
    })
    .filter((alternative): alternative is MealBudgetAlternative => Boolean(alternative))
    .sort((a, b) => b.savings - a.savings)
    .slice(0, maxAlternatives);
}

export function totalAlternativeSavings(alternatives: readonly MealBudgetAlternative[]) {
  return alternatives.reduce((total, alternative) => total + alternative.savings, 0);
}
