export type PackageEvidence = {
  packageSize: number;
  packageUnit: 'g' | 'ml' | 'piece';
};

export type NormalizedUnitPrice = PackageEvidence & {
  value: number;
  comparableUnit: 'kg' | 'l' | 'piece';
};

export type RecipeProductCandidate = {
  productId?: string;
  slug?: string;
  name: string;
  price?: number | string;
  unitPrice?: string;
  store?: string;
  source?: string;
};

export type ParsedRecipeIngredient = {
  rawText: string;
  quantityText: string;
  normalizedName: string;
};

export type RecipeProductMatch = ParsedRecipeIngredient & {
  productId: string;
  productName: string;
  priceLabel: string;
  unitPriceLabel: string;
  storeLabel: string;
  sourceLabel: string;
  matchScore: number;
};

const recipeQuantityPattern = /^((?:\d+(?:[.,/]\d+)?|\d+\s+\d+\/\d+)\s*(?:kg|g|l|dl|ml|msk|tsk|st|pcs?|cups?|tbsp|tsp)?\s+)/i;
const recipeStopWords = new Set([
  'and',
  'with',
  'for',
  'fresh',
  'chopped',
  'sliced',
  'diced',
  'crushed',
  'organic',
  'ekologisk',
  'hackad',
  'skivad',
  'krossade',
  'färsk'
]);

function normalizePackageAmount(amount: number, unit: string): PackageEvidence | null {
  if (!Number.isFinite(amount) || amount <= 0) return null;
  if (unit === 'kg') return { packageSize: amount * 1000, packageUnit: 'g' };
  if (unit === 'l') return { packageSize: amount * 1000, packageUnit: 'ml' };
  if (unit === 'st' || unit === 'piece') return { packageSize: amount, packageUnit: 'piece' };
  if (unit === 'g' || unit === 'ml') return { packageSize: amount, packageUnit: unit };
  return null;
}

export function packageEvidenceFromText(text: string): PackageEvidence | null {
  const normalized = text.toLowerCase().replace(/,/g, '.');
  const multipackMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st|piece)\b/);
  if (multipackMatch) {
    const packCount = Number(multipackMatch[1]);
    const packAmount = Number(multipackMatch[2]);
    return normalizePackageAmount(packCount * packAmount, multipackMatch[3]!);
  }

  const match = normalized.match(/(\d+(?:\.\d+)?)\s*(kg|g|l|ml|st|piece)\b/);
  if (!match) return null;
  return normalizePackageAmount(Number(match[1]), match[2]!);
}

export function normalizeUnitPrice(price: number, packageEvidence: PackageEvidence | null): NormalizedUnitPrice | null {
  if (!Number.isFinite(price) || price <= 0 || !packageEvidence) return null;
  if (packageEvidence.packageUnit === 'g') {
    return {
      ...packageEvidence,
      value: (price / packageEvidence.packageSize) * 1000,
      comparableUnit: 'kg'
    };
  }
  if (packageEvidence.packageUnit === 'ml') {
    return {
      ...packageEvidence,
      value: (price / packageEvidence.packageSize) * 1000,
      comparableUnit: 'l'
    };
  }
  return {
    ...packageEvidence,
    value: price / packageEvidence.packageSize,
    comparableUnit: 'piece'
  };
}

export function normalizeUnitPriceForPackageText(price: number, packageText: string): NormalizedUnitPrice | null {
  return normalizeUnitPrice(price, packageEvidenceFromText(packageText));
}

function wordsFromText(text: string) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9åäöæø]+/gi, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !recipeStopWords.has(word));
}

function ingredientNameFromLine(line: string) {
  return line
    .replace(recipeQuantityPattern, '')
    .replace(/^[-*•\d.)\s]+/, '')
    .trim();
}

function ingredientHintsFromUrl(value: string) {
  const urlMatch = value.match(/https?:\/\/\S+/i);
  if (!urlMatch) return [];

  try {
    const url = new URL(urlMatch[0]);
    return url.pathname
      .split(/[/-]+/)
      .map((part) => part.replace(/\.(html?|php|aspx)$/i, '').trim())
      .filter((part) => part.length > 2);
  } catch {
    return [];
  }
}

export function parseRecipeIngredients(input: string): ParsedRecipeIngredient[] {
  const sourceLines = input
    .split(/\r?\n/)
    .flatMap((line) => line.split(/;|\|/))
    .map((line) => line.trim())
    .filter(Boolean);
  const lines = sourceLines.length > 0 ? sourceLines : ingredientHintsFromUrl(input);
  const parsed = lines
    .filter((line) => !/^https?:\/\//i.test(line))
    .map((line) => {
      const quantityText = line.match(recipeQuantityPattern)?.[0]?.trim() ?? '';
      const normalizedName = ingredientNameFromLine(line);
      return { rawText: line, quantityText, normalizedName };
    })
    .filter((ingredient) => wordsFromText(ingredient.normalizedName).length > 0);

  return parsed.length > 0 ? parsed : ingredientHintsFromUrl(input).map((hint) => ({ rawText: hint, quantityText: '', normalizedName: hint }));
}

function priceLabelFor(candidate: RecipeProductCandidate) {
  if (typeof candidate.price === 'number') {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(candidate.price);
  }
  return candidate.price || 'price pending';
}

export function suggestRecipeProductMatches(
  ingredients: readonly ParsedRecipeIngredient[],
  candidates: readonly RecipeProductCandidate[],
): RecipeProductMatch[] {
  return ingredients.map((ingredient) => {
    const ingredientWords = wordsFromText(ingredient.normalizedName);
    const ranked = candidates
      .map((candidate, index) => {
        const productWords = wordsFromText(candidate.name);
        const overlap = ingredientWords.filter((word) => productWords.some((productWord) => productWord.includes(word) || word.includes(productWord))).length;
        const directNameHit = productWords.join(' ').includes(ingredientWords.join(' ')) ? 2 : 0;
        return { candidate, index, score: overlap * 10 + directNameHit };
      })
      .sort((a, b) => b.score - a.score || a.index - b.index);
    const best = ranked[0]?.candidate ?? candidates[0];
    const bestScore = ranked[0]?.score ?? 0;

    return {
      ...ingredient,
      productId: best?.productId ?? best?.slug ?? ingredient.normalizedName.toLowerCase().replace(/\s+/g, '-'),
      productName: best?.name ?? ingredient.normalizedName,
      priceLabel: best ? priceLabelFor(best) : 'price pending',
      unitPriceLabel: best?.unitPrice ?? 'unit price pending',
      storeLabel: best?.store ?? 'store pending',
      sourceLabel: best?.source ?? 'recipe parser match',
      matchScore: bestScore
    };
  });
}
