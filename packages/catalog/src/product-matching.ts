export type ProductMatchMarket = 'SE' | 'NO' | 'IS';

export type ProductMatchConfidenceBand = 'high' | 'medium' | 'low' | 'review';

export type ProductMatchFactorType = 'ean' | 'commodity' | 'alias' | 'brand_size' | 'nutrition' | 'market_alias';

export type ProductMatchNutrition = {
  energyKcalPer100g?: number;
  proteinPer100g?: number;
  carbsPer100g?: number;
  fatPer100g?: number;
  saltPer100g?: number;
  sugarPer100g?: number;
};

export type ProductMatchInput = {
  id: string;
  name: string;
  market?: ProductMatchMarket;
  ean?: string | null;
  gtin?: string | null;
  commodityId?: string | null;
  aliases?: string[];
  brand?: string | null;
  sizeText?: string | null;
  nutrition?: ProductMatchNutrition | null;
};

export type ProductMatchFactor = {
  type: ProductMatchFactorType;
  score: number;
  label: string;
  evidence: string[];
};

export type ExplainableProductMatch = {
  candidateId: string;
  score: number;
  confidence: ProductMatchConfidenceBand;
  requiresReview: boolean;
  factors: ProductMatchFactor[];
  explanation: string;
};

export type ProductMatchRankingOptions = {
  minScore?: number;
  maxResults?: number;
};

type AliasGroup = {
  canonical: string;
  terms: readonly string[];
};

const MARKET_ALIAS_GROUPS: Record<ProductMatchMarket, readonly AliasGroup[]> = {
  SE: [
    { canonical: 'milk', terms: ['mjölk', 'mjolk', 'milk'] },
    { canonical: 'oats', terms: ['havregryn', 'oats'] },
    { canonical: 'banana', terms: ['banan', 'banana'] },
    { canonical: 'eggs', terms: ['ägg', 'agg', 'eggs', 'egg'] },
    { canonical: 'butter', terms: ['smör', 'smor', 'butter'] },
    { canonical: 'cheese', terms: ['ost', 'cheese'] }
  ],
  NO: [
    { canonical: 'milk', terms: ['melk', 'milk'] },
    { canonical: 'oats', terms: ['havregryn', 'oats'] },
    { canonical: 'banana', terms: ['banan', 'banana'] },
    { canonical: 'eggs', terms: ['egg', 'eggs'] },
    { canonical: 'butter', terms: ['smør', 'smor', 'butter'] },
    { canonical: 'cheese', terms: ['ost', 'cheese'] }
  ],
  IS: [
    { canonical: 'milk', terms: ['mjólk', 'mjolk', 'milk'] },
    { canonical: 'oats', terms: ['hafrar', 'hafragrjón', 'havregryn', 'oats'] },
    { canonical: 'banana', terms: ['banani', 'banana'] },
    { canonical: 'eggs', terms: ['egg', 'eggs', 'eggja'] },
    { canonical: 'butter', terms: ['smjör', 'smjor', 'butter'] },
    { canonical: 'cheese', terms: ['ostur', 'ost', 'cheese'] }
  ]
};

const DEFAULT_MIN_SCORE = 25;
const TOKEN_MATCH_LIMIT = 18;

export function normalizeProductMatchText(value: string, market: ProductMatchMarket = 'SE'): string {
  const locale = market === 'IS' ? 'is-IS' : market === 'NO' ? 'nb-NO' : 'sv-SE';
  return value
    .toLocaleLowerCase(locale)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/þ/g, 'th')
    .replace(/ð/g, 'd')
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function explainProductMatch(source: ProductMatchInput, candidate: ProductMatchInput): ExplainableProductMatch {
  const market = source.market ?? candidate.market ?? 'SE';
  const factors: ProductMatchFactor[] = [];
  const sourceEan = normalizedEan(source);
  const candidateEan = normalizedEan(candidate);
  const conflictingEan = Boolean(sourceEan && candidateEan && sourceEan !== candidateEan);

  if (sourceEan && candidateEan) {
    if (sourceEan === candidateEan) {
      factors.push({
        type: 'ean',
        score: 60,
        label: 'Exact EAN/GTIN match',
        evidence: [sourceEan]
      });
    } else {
      factors.push({
        type: 'ean',
        score: -30,
        label: 'Different EAN/GTIN values',
        evidence: [sourceEan, candidateEan]
      });
    }
  }

  if (source.commodityId && candidate.commodityId && source.commodityId === candidate.commodityId) {
    factors.push({
      type: 'commodity',
      score: 25,
      label: 'Same commodity',
      evidence: [source.commodityId]
    });
  }

  const aliasFactor = buildAliasFactor(source, candidate, market);
  if (aliasFactor) factors.push(aliasFactor);

  const marketAliasFactor = buildMarketAliasFactor(source, candidate, market);
  if (marketAliasFactor) factors.push(marketAliasFactor);

  const brandSizeFactor = buildBrandSizeFactor(source, candidate, market);
  if (brandSizeFactor) factors.push(brandSizeFactor);

  const nutritionFactor = buildNutritionFactor(source, candidate);
  if (nutritionFactor) factors.push(nutritionFactor);

  const score = clampScore(factors.reduce((total, factor) => total + factor.score, 0));
  const confidence = confidenceFor(score, conflictingEan);
  const requiresReview = confidence === 'review' || conflictingEan || (score < 55 && Boolean(sourceEan || candidateEan));

  return {
    candidateId: candidate.id,
    score,
    confidence,
    requiresReview,
    factors,
    explanation: buildExplanation(confidence, factors, requiresReview)
  };
}

export function rankExplainableProductMatches(
  source: ProductMatchInput,
  candidates: readonly ProductMatchInput[],
  options: ProductMatchRankingOptions = {}
): ExplainableProductMatch[] {
  const minScore = options.minScore ?? DEFAULT_MIN_SCORE;
  return candidates
    .map((candidate) => explainProductMatch(source, candidate))
    .filter((match) => match.score >= minScore || match.requiresReview)
    .sort((a, b) => b.score - a.score || a.candidateId.localeCompare(b.candidateId))
    .slice(0, options.maxResults);
}

export function marketAliasTermsFor(market: ProductMatchMarket, value: string): string[] {
  const normalized = normalizeProductMatchText(value, market);
  if (!normalized) return [];

  const tokens = new Set(tokenize(normalized));
  const terms = new Set<string>();
  for (const group of MARKET_ALIAS_GROUPS[market]) {
    const normalizedTerms = group.terms.map((term) => normalizeProductMatchText(term, market));
    if (normalizedTerms.some((term) => tokens.has(term) || normalized.includes(term))) {
      terms.add(group.canonical);
      normalizedTerms.forEach((term) => terms.add(term));
    }
  }
  return [...terms].sort();
}

function buildAliasFactor(source: ProductMatchInput, candidate: ProductMatchInput, market: ProductMatchMarket): ProductMatchFactor | null {
  const sourceTokens = productTokens(source, market);
  const candidateTokens = productTokens(candidate, market);
  const shared = [...sourceTokens].filter((token) => candidateTokens.has(token)).slice(0, TOKEN_MATCH_LIMIT);
  if (shared.length === 0) return null;

  return {
    type: 'alias',
    score: Math.min(20, 5 + shared.length * 3),
    label: 'Shared normalized name or alias terms',
    evidence: shared
  };
}

function buildMarketAliasFactor(source: ProductMatchInput, candidate: ProductMatchInput, market: ProductMatchMarket): ProductMatchFactor | null {
  const sourceTerms = new Set(expandMarketAliases(source, market));
  const candidateTerms = new Set(expandMarketAliases(candidate, market));
  const shared = [...sourceTerms].filter((term) => candidateTerms.has(term)).slice(0, 8);
  if (shared.length === 0) return null;

  return {
    type: 'market_alias',
    score: Math.min(30, 27 + shared.length * 3),
    label: `${market} language alias match`,
    evidence: shared
  };
}

function buildBrandSizeFactor(source: ProductMatchInput, candidate: ProductMatchInput, market: ProductMatchMarket): ProductMatchFactor | null {
  const sourceBrand = normalizeProductMatchText(source.brand ?? '', market);
  const candidateBrand = normalizeProductMatchText(candidate.brand ?? '', market);
  const sourceSize = normalizeSizeText(source.sizeText ?? '');
  const candidateSize = normalizeSizeText(candidate.sizeText ?? '');
  const evidence: string[] = [];

  if (sourceBrand && candidateBrand && sourceBrand === candidateBrand) evidence.push(`brand:${sourceBrand}`);
  if (sourceSize && candidateSize && sourceSize === candidateSize) evidence.push(`size:${sourceSize}`);
  if (evidence.length === 0) return null;

  return {
    type: 'brand_size',
    score: evidence.length === 2 ? 15 : 8,
    label: evidence.length === 2 ? 'Same brand and pack size' : 'Same brand or pack size',
    evidence
  };
}

function buildNutritionFactor(source: ProductMatchInput, candidate: ProductMatchInput): ProductMatchFactor | null {
  const sourceNutrition = source.nutrition;
  const candidateNutrition = candidate.nutrition;
  if (!sourceNutrition || !candidateNutrition) return null;

  const comparableKeys: Array<keyof ProductMatchNutrition> = [
    'energyKcalPer100g',
    'proteinPer100g',
    'carbsPer100g',
    'fatPer100g',
    'saltPer100g',
    'sugarPer100g'
  ];
  const closeKeys = comparableKeys.filter((key) => {
    const sourceValue = sourceNutrition[key];
    const candidateValue = candidateNutrition[key];
    if (typeof sourceValue !== 'number' || typeof candidateValue !== 'number') return false;
    const tolerance = key === 'energyKcalPer100g' ? 30 : key === 'saltPer100g' ? 0.2 : 1.5;
    return Math.abs(sourceValue - candidateValue) <= tolerance;
  });
  if (closeKeys.length < 2) return null;

  return {
    type: 'nutrition',
    score: Math.min(10, 4 + closeKeys.length),
    label: 'Similar nutrition per 100g',
    evidence: closeKeys.map((key) => key.replace('Per100g', ''))
  };
}

function productTokens(product: ProductMatchInput, market: ProductMatchMarket): Set<string> {
  const text = [product.name, ...(product.aliases ?? [])].map((value) => normalizeProductMatchText(value, market)).join(' ');
  return new Set(tokenize(text).filter((token) => token.length > 1));
}

function expandMarketAliases(product: ProductMatchInput, market: ProductMatchMarket): string[] {
  return [product.name, ...(product.aliases ?? [])].flatMap((value) => marketAliasTermsFor(market, value));
}

function tokenize(value: string): string[] {
  return value.split(/\s+/).filter(Boolean);
}

function normalizedEan(product: ProductMatchInput): string {
  return (product.ean ?? product.gtin ?? '').replace(/\D/g, '');
}

function normalizeSizeText(value: string): string {
  const match = value.toLocaleLowerCase('sv-SE').replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(kg|g|gram|l|liter|ml|cl|st|pcs|pack)/);
  if (!match) return normalizeProductMatchText(value);

  const amount = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(amount)) return normalizeProductMatchText(value);
  if (unit === 'kg') return `${amount * 1000}g`;
  if (unit === 'gram') return `${amount}g`;
  if (unit === 'l' || unit === 'liter') return `${amount * 1000}ml`;
  if (unit === 'cl') return `${amount * 10}ml`;
  if (unit === 'pcs' || unit === 'pack') return `${amount}st`;
  return `${amount}${unit}`;
}

function confidenceFor(score: number, conflictingEan: boolean): ProductMatchConfidenceBand {
  if (conflictingEan) return 'review';
  if (score >= 80) return 'high';
  if (score >= 55) return 'medium';
  if (score >= 35) return 'low';
  return 'review';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildExplanation(confidence: ProductMatchConfidenceBand, factors: ProductMatchFactor[], requiresReview: boolean): string {
  const positiveFactors = factors.filter((factor) => factor.score > 0);
  const factorLabels = positiveFactors.map((factor) => factor.label.toLocaleLowerCase('en-US'));
  const basis = factorLabels.length > 0 ? factorLabels.join(', ') : 'insufficient matching signals';
  return `${confidence} confidence from ${basis}${requiresReview ? '; review before merging' : ''}`;
}
