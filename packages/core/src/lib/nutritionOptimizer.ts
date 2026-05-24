export type NutritionTargets = {
  calories: number;
  proteinG: number;
  fiberG: number;
  maxSodiumMg: number;
};

export type NutritionProductCandidate = NutritionTargets & {
  productId: string;
  productName: string;
  price: number;
  source: string;
};

export type NutritionOptimizerLine = NutritionProductCandidate & {
  quantity: number;
  linePrice: number;
};

export type NutritionOptimizerTotals = NutritionTargets & {
  productCount: number;
};

export type NutritionOptimizerResult = {
  status: 'met' | 'partial';
  totalPrice: number;
  totals: NutritionOptimizerTotals;
  lines: NutritionOptimizerLine[];
  unmet: string[];
};

export type OpenFoodFactsNutritionSeed = {
  code?: string;
  slug: string;
  name: string;
  categories: string[];
  nutriscoreGrade?: string;
};

const SOURCE = 'OpenFoodFacts category/nutriscore nutrition estimate';
const roundOne = (value: number): number => Math.round((value + Number.EPSILON) * 10) / 10;
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;
const normalize = (values: string[]): string => values.join(' ').toLowerCase();

function hasAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

function estimatedMacrosFor(product: OpenFoodFactsNutritionSeed): NutritionTargets {
  const text = `${product.name} ${normalize(product.categories)}`.toLowerCase();
  let estimate: NutritionTargets = { calories: 180, proteinG: 5, fiberG: 2, maxSodiumMg: 220 };

  if (hasAny(text, ['protein-powder', 'whey', 'bodybuilding-supplements'])) {
    estimate = { calories: 120, proteinG: 24, fiberG: 1, maxSodiumMg: 130 };
  } else if (hasAny(text, ['eggs', 'agg', 'ägg'])) {
    estimate = { calories: 150, proteinG: 12, fiberG: 0, maxSodiumMg: 140 };
  } else if (hasAny(text, ['legumes', 'beans', 'bonor', 'bönor', 'lentils', 'hummus'])) {
    estimate = { calories: 240, proteinG: 14, fiberG: 10, maxSodiumMg: 120 };
  } else if (hasAny(text, ['nuts', 'peanut', 'erdnusse', 'seeds', 'oilseed'])) {
    estimate = { calories: 340, proteinG: 13, fiberG: 5, maxSodiumMg: 90 };
  } else if (hasAny(text, ['breads', 'flatbreads', 'cereals', 'oat', 'havre', 'tortillas'])) {
    estimate = { calories: 260, proteinG: 8, fiberG: 6, maxSodiumMg: 420 };
  } else if (hasAny(text, ['potatoes', 'fries', 'chips-and-fries'])) {
    estimate = { calories: 210, proteinG: 4, fiberG: 4, maxSodiumMg: 320 };
  } else if (hasAny(text, ['fruits', 'vegetables', 'wokmix', 'spenat', 'spinach'])) {
    estimate = { calories: 70, proteinG: 2, fiberG: 5, maxSodiumMg: 40 };
  } else if (hasAny(text, ['dairies', 'milk', 'yogurt', 'cheese', 'dairy-drinks'])) {
    estimate = { calories: 170, proteinG: 10, fiberG: 0, maxSodiumMg: 160 };
  } else if (hasAny(text, ['beverages', 'waters', 'teas', 'coffee-drinks'])) {
    estimate = { calories: 80, proteinG: 1, fiberG: 0, maxSodiumMg: 25 };
  } else if (hasAny(text, ['sauces', 'condiments', 'salted-spreads', 'groceries'])) {
    estimate = { calories: 120, proteinG: 2, fiberG: 2, maxSodiumMg: 520 };
  } else if (hasAny(text, ['desserts', 'sweet-snacks', 'ice-creams', 'chocolates'])) {
    estimate = { calories: 270, proteinG: 4, fiberG: 1, maxSodiumMg: 130 };
  }

  const grade = product.nutriscoreGrade?.toLowerCase();
  const sodiumMultiplier = grade === 'e' ? 1.35 : grade === 'd' ? 1.2 : grade === 'a' ? 0.85 : 1;
  return {
    calories: roundOne(estimate.calories),
    proteinG: roundOne(estimate.proteinG),
    fiberG: roundOne(estimate.fiberG),
    maxSodiumMg: roundOne(estimate.maxSodiumMg * sodiumMultiplier)
  };
}

export function estimateNutritionFromOpenFoodFactsProduct(product: OpenFoodFactsNutritionSeed, price = 10): NutritionProductCandidate {
  const estimate = estimatedMacrosFor(product);
  return {
    productId: product.code ?? product.slug,
    productName: product.name,
    price: roundMoney(price),
    calories: estimate.calories,
    proteinG: estimate.proteinG,
    fiberG: estimate.fiberG,
    maxSodiumMg: estimate.maxSodiumMg,
    source: SOURCE
  };
}

function totalsFor(lines: NutritionOptimizerLine[]): NutritionOptimizerTotals {
  return lines.reduce<NutritionOptimizerTotals>(
    (totals, line) => ({
      calories: roundOne(totals.calories + line.calories * line.quantity),
      proteinG: roundOne(totals.proteinG + line.proteinG * line.quantity),
      fiberG: roundOne(totals.fiberG + line.fiberG * line.quantity),
      maxSodiumMg: roundOne(totals.maxSodiumMg + line.maxSodiumMg * line.quantity),
      productCount: totals.productCount + line.quantity
    }),
    { calories: 0, proteinG: 0, fiberG: 0, maxSodiumMg: 0, productCount: 0 }
  );
}

function unmetFor(targets: NutritionTargets, totals: NutritionOptimizerTotals): string[] {
  const unmet: string[] = [];
  if (totals.calories < targets.calories) unmet.push(`${roundOne(targets.calories - totals.calories)} calories short`);
  if (totals.proteinG < targets.proteinG) unmet.push(`${roundOne(targets.proteinG - totals.proteinG)}g protein short`);
  if (totals.fiberG < targets.fiberG) unmet.push(`${roundOne(targets.fiberG - totals.fiberG)}g fiber short`);
  if (totals.maxSodiumMg > targets.maxSodiumMg) unmet.push(`${roundOne(totals.maxSodiumMg - targets.maxSodiumMg)}mg sodium over`);
  return unmet;
}

function progressScore(targets: NutritionTargets, totals: NutritionOptimizerTotals): number {
  const calories = Math.min(totals.calories / Math.max(targets.calories, 1), 1);
  const protein = Math.min(totals.proteinG / Math.max(targets.proteinG, 1), 1);
  const fiber = Math.min(totals.fiberG / Math.max(targets.fiberG, 1), 1);
  const sodiumPenalty = Math.max((totals.maxSodiumMg - targets.maxSodiumMg) / Math.max(targets.maxSodiumMg, 1), 0);
  return calories + protein + fiber - sodiumPenalty * 1.5;
}

function resultFor(targets: NutritionTargets, lines: NutritionOptimizerLine[]): NutritionOptimizerResult {
  const totals = totalsFor(lines);
  const unmet = unmetFor(targets, totals);
  return {
    status: unmet.length === 0 ? 'met' : 'partial',
    totalPrice: roundMoney(lines.reduce((sum, line) => sum + line.linePrice, 0)),
    totals,
    lines: lines.map((line) => ({ ...line })),
    unmet
  };
}

export function optimizeDietNutrition(
  targets: NutritionTargets,
  products: NutritionProductCandidate[],
  options: { maxCandidates?: number; maxItems?: number; maxQuantity?: number } = {}
): NutritionOptimizerResult {
  const maxCandidates = options.maxCandidates ?? 14;
  const maxItems = options.maxItems ?? 4;
  const maxQuantity = options.maxQuantity ?? 3;
  const candidates = products
    .filter((product) => product.price >= 0)
    .slice(0, maxCandidates);

  let bestMet: NutritionOptimizerResult | undefined;
  let bestPartial: NutritionOptimizerResult = resultFor(targets, []);

  function visit(index: number, selected: NutritionOptimizerLine[], itemCount: number): void {
    const current = resultFor(targets, selected);
    if (current.status === 'met') {
      if (!bestMet || current.totalPrice < bestMet.totalPrice) bestMet = current;
      return;
    }

    const currentScore = progressScore(targets, current.totals);
    const bestPartialScore = progressScore(targets, bestPartial.totals);
    if (currentScore > bestPartialScore || (currentScore === bestPartialScore && current.totalPrice < bestPartial.totalPrice)) {
      bestPartial = current;
    }

    if (index >= candidates.length || itemCount >= maxItems) return;
    visit(index + 1, selected, itemCount);

    const product = candidates[index]!;
    for (let quantity = 1; quantity <= maxQuantity && itemCount + quantity <= maxItems; quantity += 1) {
      selected.push({ ...product, quantity, linePrice: roundMoney(product.price * quantity) });
      visit(index + 1, selected, itemCount + quantity);
      selected.pop();
    }
  }

  visit(0, [], 0);
  return bestMet ?? bestPartial;
}
