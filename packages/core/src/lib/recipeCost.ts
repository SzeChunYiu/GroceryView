export type RecipeIngredientLine = {
  raw: string;
  quantity: number;
  unit: string;
  ingredient: string;
};

export type RecipeProductOffer = {
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  canonicalIngredient: string;
  packageQuantity: number;
  packageUnit: string;
  packagePrice: number;
  confidence: number;
};

export type RecipeCostMatch = RecipeIngredientLine & {
  matchedProductId: string;
  matchedProductName: string;
  storeName: string;
  ingredientCost: number;
  confidence: number;
};

export type RecipeStoreCost = {
  storeId: string;
  storeName: string;
  totalCost: number;
  costPerPortion: number;
  matchedIngredients: number;
  coverageShare: number;
  averageConfidence: number;
};

export type RecipeCostResult = {
  country: string;
  portions: number;
  matches: RecipeCostMatch[];
  storeOptions: RecipeStoreCost[];
  cheapestStore: RecipeStoreCost | null;
  unmatchedIngredients: RecipeIngredientLine[];
};

const unitAliases: Record<string, string> = {
  g: 'g',
  gram: 'g',
  grams: 'g',
  kg: 'g',
  ml: 'ml',
  l: 'ml',
  dl: 'ml',
  st: 'piece',
  pcs: 'piece',
  piece: 'piece',
  pieces: 'piece'
};

export const defaultRecipeProductOffers: RecipeProductOffer[] = [
  { productId: 'rice-willys', productName: 'Jasminris 1 kg', storeId: 'willys', storeName: 'Willys', canonicalIngredient: 'rice', packageQuantity: 1000, packageUnit: 'g', packagePrice: 32.9, confidence: 0.88 },
  { productId: 'rice-ica', productName: 'Ris 1 kg', storeId: 'ica', storeName: 'ICA', canonicalIngredient: 'rice', packageQuantity: 1000, packageUnit: 'g', packagePrice: 36.9, confidence: 0.84 },
  { productId: 'chicken-willys', productName: 'Kycklingfile 900 g', storeId: 'willys', storeName: 'Willys', canonicalIngredient: 'chicken', packageQuantity: 900, packageUnit: 'g', packagePrice: 99.9, confidence: 0.86 },
  { productId: 'chicken-ica', productName: 'Kycklingfile 1 kg', storeId: 'ica', storeName: 'ICA', canonicalIngredient: 'chicken', packageQuantity: 1000, packageUnit: 'g', packagePrice: 119, confidence: 0.82 },
  { productId: 'broccoli-willys', productName: 'Broccoli 250 g', storeId: 'willys', storeName: 'Willys', canonicalIngredient: 'broccoli', packageQuantity: 250, packageUnit: 'g', packagePrice: 24.9, confidence: 0.8 },
  { productId: 'broccoli-ica', productName: 'Broccoli 250 g', storeId: 'ica', storeName: 'ICA', canonicalIngredient: 'broccoli', packageQuantity: 250, packageUnit: 'g', packagePrice: 27.9, confidence: 0.78 },
  { productId: 'cream-willys', productName: 'Matlagningsgrädde 5 dl', storeId: 'willys', storeName: 'Willys', canonicalIngredient: 'cream', packageQuantity: 500, packageUnit: 'ml', packagePrice: 18.9, confidence: 0.83 },
  { productId: 'cream-ica', productName: 'Matgrädde 5 dl', storeId: 'ica', storeName: 'ICA', canonicalIngredient: 'cream', packageQuantity: 500, packageUnit: 'ml', packagePrice: 21.9, confidence: 0.8 }
];

const canonicalIngredientAliases: Record<string, string> = {
  ris: 'rice',
  rice: 'rice',
  kyckling: 'chicken',
  chicken: 'chicken',
  broccoli: 'broccoli',
  grädde: 'cream',
  gradde: 'cream',
  cream: 'cream'
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeQuantity(quantity: number, unit: string) {
  if (unit === 'kg') return { quantity: quantity * 1000, unit: 'g' };
  if (unit === 'l') return { quantity: quantity * 1000, unit: 'ml' };
  if (unit === 'dl') return { quantity: quantity * 100, unit: 'ml' };
  return { quantity, unit: unitAliases[unit] ?? unit };
}

function canonicalIngredientFor(value: string) {
  const normalized = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  return Object.entries(canonicalIngredientAliases).find(([alias]) => normalized.includes(alias))?.[1] ?? normalized.split(/\s+/)[0] ?? normalized;
}

export function parseRecipeIngredients(recipeText: string): RecipeIngredientLine[] {
  return recipeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((raw) => {
      const match = raw.match(/^(\d+(?:[,.]\d+)?)\s*(kg|g|gram|grams|l|dl|ml|st|pcs|piece|pieces)?\s+(.+)$/i);
      if (!match) return { raw, quantity: 1, unit: 'piece', ingredient: canonicalIngredientFor(raw) };
      const parsedQuantity = Number(match[1]!.replace(',', '.'));
      const parsedUnit = (match[2] ?? 'piece').toLowerCase();
      const normalized = normalizeQuantity(parsedQuantity, parsedUnit);
      return {
        raw,
        quantity: normalized.quantity,
        unit: normalized.unit,
        ingredient: canonicalIngredientFor(match[3]!)
      };
    });
}

function ingredientCost(line: RecipeIngredientLine, offer: RecipeProductOffer) {
  if (line.unit !== offer.packageUnit || offer.packageQuantity <= 0) return null;
  return roundMoney((line.quantity / offer.packageQuantity) * offer.packagePrice);
}

export function calculateRecipeCost(input: {
  recipeText: string;
  portions: number;
  country?: string;
  offers?: RecipeProductOffer[];
}): RecipeCostResult {
  const country = input.country ?? 'SE';
  const portions = Math.max(1, input.portions);
  const offers = input.offers ?? defaultRecipeProductOffers;
  const ingredients = parseRecipeIngredients(input.recipeText);
  const storeIds = [...new Set(offers.map((offer) => offer.storeId))];
  const storeOptions = storeIds.map((storeId): RecipeStoreCost => {
    const storeOffers = offers.filter((offer) => offer.storeId === storeId);
    const matches = ingredients.flatMap((ingredient) => {
      const offer = storeOffers.find((candidate) => candidate.canonicalIngredient === ingredient.ingredient);
      if (!offer) return [];
      const cost = ingredientCost(ingredient, offer);
      return cost === null ? [] : [{ ingredient, offer, cost }];
    });
    const totalCost = roundMoney(matches.reduce((sum, match) => sum + match.cost, 0));
    const averageConfidence = matches.length === 0 ? 0 : matches.reduce((sum, match) => sum + match.offer.confidence, 0) / matches.length;
    return {
      storeId,
      storeName: storeOffers[0]?.storeName ?? storeId,
      totalCost,
      costPerPortion: roundMoney(totalCost / portions),
      matchedIngredients: matches.length,
      coverageShare: ingredients.length === 0 ? 0 : matches.length / ingredients.length,
      averageConfidence: roundMoney(averageConfidence)
    };
  }).sort((left, right) => right.coverageShare - left.coverageShare || left.totalCost - right.totalCost);
  const cheapestStore = storeOptions.find((store) => store.coverageShare === 1) ?? null;
  const bestStoreOffers = cheapestStore ? offers.filter((offer) => offer.storeId === cheapestStore.storeId) : [];
  const matches = cheapestStore ? ingredients.flatMap((ingredient) => {
    const offer = bestStoreOffers.find((candidate) => candidate.canonicalIngredient === ingredient.ingredient);
    if (!offer) return [];
    const cost = ingredientCost(ingredient, offer);
    if (cost === null) return [];
    return [{
      ...ingredient,
      matchedProductId: offer.productId,
      matchedProductName: offer.productName,
      storeName: offer.storeName,
      ingredientCost: cost,
      confidence: offer.confidence
    }];
  }) : [];
  const matchedIngredients = new Set(matches.map((match) => match.raw));
  return {
    country,
    portions,
    matches,
    storeOptions,
    cheapestStore,
    unmatchedIngredients: ingredients.filter((ingredient) => !matchedIngredients.has(ingredient.raw))
  };
}
