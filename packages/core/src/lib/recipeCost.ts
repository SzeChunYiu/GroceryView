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
  ingredientCount?: number;
};

type RecipeCostRow = RecipeCostMatchedIngredient & { ingredientCost: number };

function toBaseQuantity(quantity: number, unit: RecipeCostUnit) {
  if (unit === 'kg') return { quantity: quantity * 1000, unit: 'g' as const };
  if (unit === 'l') return { quantity: quantity * 1000, unit: 'ml' as const };
  return { quantity, unit };
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function pricedCandidate(ingredient: RecipeCostMatchedIngredient): RecipeCostRow | null {
  const needed = toBaseQuantity(ingredient.quantityNeeded, ingredient.unit);
  const packaged = toBaseQuantity(ingredient.packageQuantity, ingredient.packageUnit);
  if (needed.unit !== packaged.unit || needed.quantity <= 0 || packaged.quantity <= 0 || ingredient.packagePrice < 0) return null;
  return {
    ...ingredient,
    ingredientCost: roundMoney((needed.quantity / packaged.quantity) * ingredient.packagePrice)
  };
}

export function calculateRecipeCostPerPortion(input: RecipeCostInput) {
  if (!input.recipeId.trim()) throw new Error('recipeId is required');
  if (!input.title.trim()) throw new Error('title is required');
  if (input.portions <= 0) throw new Error('portions must be positive');

  const cheapestByIngredient = new Map<string, RecipeCostRow>();
  for (const ingredient of input.matchedIngredients) {
    const priced = pricedCandidate(ingredient);
    if (!priced) continue;
    const current = cheapestByIngredient.get(ingredient.ingredientId);
    if (!current || priced.ingredientCost < current.ingredientCost || (priced.ingredientCost === current.ingredientCost && priced.confidence > current.confidence)) {
      cheapestByIngredient.set(ingredient.ingredientId, priced);
    }
  }

  const rows = [...cheapestByIngredient.values()].sort((left, right) => left.label.localeCompare(right.label));
  const ingredientCount = input.ingredientCount ?? new Set(input.matchedIngredients.map((ingredient) => ingredient.ingredientId)).size;
  const totalCost = roundMoney(rows.reduce((sum, row) => sum + row.ingredientCost, 0));
  const averageConfidence = rows.length === 0 ? 0 : Math.round((rows.reduce((sum, row) => sum + row.confidence, 0) / rows.length) * 100) / 100;
  const cheapestStoreNames = [...new Set(rows.map((row) => row.storeName))].sort();

  return {
    recipeId: input.recipeId,
    title: input.title,
    portions: input.portions,
    totalCost,
    costPerPortion: roundMoney(totalCost / input.portions),
    matchedIngredientCount: rows.length,
    ingredientCount,
    candidateCount: input.matchedIngredients.length,
    averageConfidence,
    cheapestStoreNames,
    rows,
    confidenceLabel: `${rows.length}/${ingredientCount} ingredients matched to canonical products with average confidence ${Math.round(averageConfidence * 100)}%.`
  };
}
