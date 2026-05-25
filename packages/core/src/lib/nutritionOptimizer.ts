export type NutritionTargets = {
  calories: number;
  proteinGrams: number;
  fiberGrams: number;
  maxSodiumMilligrams: number;
};

export type NutritionOptimizerProduct = {
  id: string;
  name: string;
  brand?: string;
  price: number;
  packageLabel?: string;
  nutritionPerPackage: {
    calories: number;
    proteinGrams: number;
    fiberGrams: number;
    sodiumMilligrams: number;
  };
};

export type NutritionOptimizerSelection = {
  product: NutritionOptimizerProduct;
  quantity: number;
  lineCost: number;
};

export type NutritionOptimizerResult = {
  feasible: boolean;
  selections: NutritionOptimizerSelection[];
  totalCost: number;
  totals: NutritionTargets;
  remaining: NutritionTargets;
  consideredProducts: number;
  guardrail: string;
};

const emptyTotals: NutritionTargets = {
  calories: 0,
  proteinGrams: 0,
  fiberGrams: 0,
  maxSodiumMilligrams: 0
};

function addPackage(totals: NutritionTargets, product: NutritionOptimizerProduct, quantity: number): NutritionTargets {
  return {
    calories: totals.calories + product.nutritionPerPackage.calories * quantity,
    proteinGrams: totals.proteinGrams + product.nutritionPerPackage.proteinGrams * quantity,
    fiberGrams: totals.fiberGrams + product.nutritionPerPackage.fiberGrams * quantity,
    maxSodiumMilligrams: totals.maxSodiumMilligrams + product.nutritionPerPackage.sodiumMilligrams * quantity
  };
}

function meetsTargets(totals: NutritionTargets, targets: NutritionTargets) {
  return (
    totals.calories >= targets.calories
    && totals.proteinGrams >= targets.proteinGrams
    && totals.fiberGrams >= targets.fiberGrams
    && totals.maxSodiumMilligrams <= targets.maxSodiumMilligrams
  );
}

function remainingTargets(totals: NutritionTargets, targets: NutritionTargets): NutritionTargets {
  return {
    calories: Math.max(0, targets.calories - totals.calories),
    proteinGrams: Math.max(0, targets.proteinGrams - totals.proteinGrams),
    fiberGrams: Math.max(0, targets.fiberGrams - totals.fiberGrams),
    maxSodiumMilligrams: Math.max(0, totals.maxSodiumMilligrams - targets.maxSodiumMilligrams)
  };
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

export function optimizeNutritionBasket(
  products: NutritionOptimizerProduct[],
  targets: NutritionTargets,
  options: { maxPackagesPerProduct?: number; candidateLimit?: number } = {}
): NutritionOptimizerResult {
  const maxPackagesPerProduct = options.maxPackagesPerProduct ?? 3;
  const candidateLimit = options.candidateLimit ?? 8;
  const candidates = products
    .filter((product) => (
      product.price > 0
      && product.nutritionPerPackage.calories > 0
      && product.nutritionPerPackage.sodiumMilligrams <= targets.maxSodiumMilligrams
    ))
    .sort((left, right) => {
      const leftScore = (left.nutritionPerPackage.proteinGrams * 4 + left.nutritionPerPackage.fiberGrams * 3 + left.nutritionPerPackage.calories / 200) / left.price;
      const rightScore = (right.nutritionPerPackage.proteinGrams * 4 + right.nutritionPerPackage.fiberGrams * 3 + right.nutritionPerPackage.calories / 200) / right.price;
      return rightScore - leftScore || left.price - right.price || left.name.localeCompare(right.name, 'sv');
    })
    .slice(0, candidateLimit);

  let best: { quantities: number[]; totals: NutritionTargets; totalCost: number } | null = null;

  function visit(index: number, quantities: number[], totals: NutritionTargets, totalCost: number) {
    if (totals.maxSodiumMilligrams > targets.maxSodiumMilligrams) return;
    if (best && totalCost >= best.totalCost) return;
    if (index === candidates.length) {
      if (meetsTargets(totals, targets)) best = { quantities: [...quantities], totals, totalCost };
      return;
    }

    const product = candidates[index];
    if (!product) return;
    for (let quantity = 0; quantity <= maxPackagesPerProduct; quantity += 1) {
      quantities[index] = quantity;
      visit(
        index + 1,
        quantities,
        addPackage(totals, product, quantity),
        totalCost + product.price * quantity
      );
    }
    quantities[index] = 0;
  }

  visit(0, [], emptyTotals, 0);

  if (!best) {
    return {
      feasible: false,
      selections: [],
      totalCost: 0,
      totals: emptyTotals,
      remaining: targets,
      consideredProducts: candidates.length,
      guardrail: 'No synthetic nutrition or price estimates were added; widen targets or wait for more OpenFoodFacts-labelled priced rows.'
    };
  }

  const selections = best.quantities
    .map((quantity, index) => ({ product: candidates[index], quantity }))
    .filter((selection): selection is { product: NutritionOptimizerProduct; quantity: number } => Boolean(selection.product))
    .filter((selection) => selection.quantity > 0)
    .map((selection) => ({
      ...selection,
      lineCost: round(selection.product.price * selection.quantity)
    }));

  return {
    feasible: true,
    selections,
    totalCost: round(best.totalCost),
    totals: {
      calories: round(best.totals.calories),
      proteinGrams: round(best.totals.proteinGrams),
      fiberGrams: round(best.totals.fiberGrams),
      maxSodiumMilligrams: round(best.totals.maxSodiumMilligrams)
    },
    remaining: remainingTargets(best.totals, targets),
    consideredProducts: candidates.length,
    guardrail: 'Cheapest combination is brute-forced over the visible priced OpenFoodFacts-labelled candidates only; missing labels or prices remain excluded.'
  };
}
