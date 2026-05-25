export type RecipeCostUnit = 'kg' | 'g' | 'l' | 'ml' | 'piece';

export type RecipeCostMatchedIngredient = {
  ingredientId: string;
  label: string;
  quantityNeeded: number;
  unit: RecipeCostUnit;
  canonicalProductId: string;
  productName: string;
  storeName: string;
  packageQuantity: number;
  packageUnit: RecipeCostUnit;
  packagePrice: number;
  confidence: number;
};

export type RecipeCostInput = {
  recipeId: string;
  title: string;
  portions: number;
  matchedIngredients: RecipeCostMatchedIngredient[];
};

function toBaseQuantity(quantity: number, unit: RecipeCostUnit) {
  if (unit === 'kg') return { quantity: quantity * 1000, unit: 'g' as const };
  if (unit === 'l') return { quantity: quantity * 1000, unit: 'ml' as const };
  return { quantity, unit };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateRecipeCostPerPortion(input: RecipeCostInput) {
  if (input.portions <= 0) throw new Error('portions must be positive');
  const rows = input.matchedIngredients.flatMap((ingredient) => {
    const needed = toBaseQuantity(ingredient.quantityNeeded, ingredient.unit);
    const packaged = toBaseQuantity(ingredient.packageQuantity, ingredient.packageUnit);
    if (needed.unit !== packaged.unit || packaged.quantity <= 0 || ingredient.packagePrice < 0) return [];
    const ingredientCost = roundMoney((needed.quantity / packaged.quantity) * ingredient.packagePrice);
    return [{ ...ingredient, ingredientCost }];
  });
  const totalCost = roundMoney(rows.reduce((sum, row) => sum + row.ingredientCost, 0));
  const averageConfidence = rows.length === 0 ? 0 : Math.round((rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) * 100) / 100;

  return {
    recipeId: input.recipeId,
    title: input.title,
    portions: input.portions,
    totalCost,
    costPerPortion: roundMoney(totalCost / input.portions),
    matchedIngredientCount: rows.length,
    ingredientCount: input.matchedIngredients.length,
    averageConfidence,
    rows,
    confidenceLabel: `${rows.length}/${input.matchedIngredients.length} ingredients matched to canonical products with average confidence ${Math.round(averageConfidence * 100)}%.`
  };
}
