export type PantryItem = {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
  expiresOn?: string;
};

export type PantryRecipeNeed = {
  productId: string;
  name: string;
  quantity: number;
  unit: string;
};

export type PantryRecipeRecommendation = {
  recipeId: string;
  title: string;
  coveredByPantry: PantryRecipeNeed[];
  cheapFills: PantryRecipeNeed[];
  isCovered: boolean;
};

export function recommendRecipesFromPantry(
  pantry: PantryItem[],
  recipes: Array<{ recipeId: string; title: string; needs: PantryRecipeNeed[] }>
): PantryRecipeRecommendation[] {
  return recipes.map((recipe) => {
    const coveredByPantry = recipe.needs.filter((need) => pantry.some((item) => item.productId === need.productId && item.quantity >= need.quantity));
    const cheapFills = recipe.needs.filter((need) => !coveredByPantry.some((covered) => covered.productId === need.productId));
    return { recipeId: recipe.recipeId, title: recipe.title, coveredByPantry, cheapFills, isCovered: cheapFills.length === 0 };
  });
}
