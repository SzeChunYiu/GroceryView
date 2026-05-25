export type MenuBenchmarkIngredient = {
  label: string;
  quantity: number;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'each';
  matchedProductName: string;
  matchedStoreName: string;
  packagePrice: number;
  packageQuantity: number;
  packageUnit: 'g' | 'kg' | 'ml' | 'l' | 'each';
  confidence: number;
};

export type MenuBenchmarkInput = {
  id: string;
  dishName: string;
  menuPrice: number;
  ingredients: MenuBenchmarkIngredient[];
};

export type MenuBenchmarkStatus = 'expected' | 'priced-high-vs-cost' | 'priced-low-vs-cost';

export type MenuBenchmarkRow = {
  id: string;
  dishName: string;
  menuPrice: number;
  ingredientCost: number;
  foodCostPercent: number;
  markupMultiple: number;
  status: MenuBenchmarkStatus;
  statusLabel: string;
  confidenceLabel: string;
  ingredients: Array<MenuBenchmarkIngredient & { estimatedCost: number }>;
};

function toBaseQuantity(quantity: number, unit: MenuBenchmarkIngredient['unit']) {
  if (unit === 'kg') return quantity * 1000;
  if (unit === 'l') return quantity * 1000;
  return quantity;
}

function ingredientCost(ingredient: MenuBenchmarkIngredient) {
  const needed = toBaseQuantity(ingredient.quantity, ingredient.unit);
  const packageQuantity = toBaseQuantity(ingredient.packageQuantity, ingredient.packageUnit);
  if (!Number.isFinite(needed) || !Number.isFinite(packageQuantity) || packageQuantity <= 0 || ingredient.packagePrice <= 0) {
    return 0;
  }
  return (needed / packageQuantity) * ingredient.packagePrice;
}

function statusFor(foodCostPercent: number): MenuBenchmarkStatus {
  if (foodCostPercent < 18) return 'priced-high-vs-cost';
  if (foodCostPercent > 42) return 'priced-low-vs-cost';
  return 'expected';
}

function statusLabel(status: MenuBenchmarkStatus) {
  if (status === 'priced-high-vs-cost') return 'Priced unusually high vs ingredient cost';
  if (status === 'priced-low-vs-cost') return 'Priced unusually low vs ingredient cost';
  return 'Within benchmark band';
}

function confidenceLabel(confidence: number) {
  if (confidence >= 0.76) return 'Strong ingredient match';
  if (confidence >= 0.62) return 'Review ingredient match';
  return 'Needs operator review';
}

export function benchmarkMenuItems(items: MenuBenchmarkInput[]): MenuBenchmarkRow[] {
  return items.map((item) => {
    const ingredients = item.ingredients.map((ingredient) => ({
      ...ingredient,
      estimatedCost: ingredientCost(ingredient)
    }));
    const ingredientCostTotal = ingredients.reduce((sum, ingredient) => sum + ingredient.estimatedCost, 0);
    const foodCostPercent = item.menuPrice > 0 ? (ingredientCostTotal / item.menuPrice) * 100 : 0;
    const markupMultiple = ingredientCostTotal > 0 ? item.menuPrice / ingredientCostTotal : 0;
    const averageConfidence = ingredients.length > 0
      ? ingredients.reduce((sum, ingredient) => sum + ingredient.confidence, 0) / ingredients.length
      : 0;
    const status = statusFor(foodCostPercent);

    return {
      id: item.id,
      dishName: item.dishName,
      menuPrice: item.menuPrice,
      ingredientCost: ingredientCostTotal,
      foodCostPercent,
      markupMultiple,
      status,
      statusLabel: statusLabel(status),
      confidenceLabel: confidenceLabel(averageConfidence),
      ingredients
    };
  });
}

export function summarizeMenuBenchmark(rows: MenuBenchmarkRow[]) {
  return {
    dishCount: rows.length,
    highVsCostCount: rows.filter((row) => row.status === 'priced-high-vs-cost').length,
    lowVsCostCount: rows.filter((row) => row.status === 'priced-low-vs-cost').length,
    averageFoodCostPercent: rows.length > 0
      ? rows.reduce((sum, row) => sum + row.foodCostPercent, 0) / rows.length
      : 0
  };
}
