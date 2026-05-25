import type { RetailerType } from '../types/chain.js';

export type CrossCategoryRetailerType = RetailerType | 'online' | 'other' | (string & {});

export type CrossCategoryPriceBasis = 'package' | 'unit';

export type CrossCategoryCanonicalProduct = {
  productId: string;
  name: string;
  sku?: string;
  equivalentProductIds?: readonly string[];
};

export type CrossCategoryPriceCandidate = {
  productId: string;
  productName: string;
  chainId: string;
  chainName?: string;
  retailerType: CrossCategoryRetailerType;
  price: number;
  unitPrice?: number | null;
  currency?: string;
  sku?: string;
  canonicalSku?: string;
  storeId?: string;
  storeName?: string;
  productUrl?: string;
  observedAt?: string;
  inStock?: boolean;
  sourceConfidence?: number;
};

export type CrossCategoryCheapestSource = CrossCategoryPriceCandidate & {
  rank: number;
  effectivePrice: number;
  priceBasis: CrossCategoryPriceBasis;
  savingsVsNext: number;
  savingsVsNextPercent: number;
};

export type CrossCategoryComparison = {
  status: 'priced' | 'not_found';
  canonicalProduct: CrossCategoryCanonicalProduct;
  cheapest: CrossCategoryCheapestSource | null;
  rows: CrossCategoryCheapestSource[];
  coverage: {
    sourceCount: number;
    retailerTypes: CrossCategoryRetailerType[];
    varietySourceCount: number;
    rejectedSourceCount: number;
  };
  badgeLabel: string;
  guardrails: string[];
};

export type CrossCategoryComparisonInput = {
  canonicalProduct: CrossCategoryCanonicalProduct;
  candidates: readonly CrossCategoryPriceCandidate[];
  priceBasis?: CrossCategoryPriceBasis;
  minimumSourceConfidence?: number;
};

export function findCheapestCrossCategorySource(input: CrossCategoryComparisonInput): CrossCategoryComparison {
  const priceBasis = input.priceBasis ?? 'package';
  const minimumSourceConfidence = input.minimumSourceConfidence ?? 0;
  const rows = input.candidates
    .filter((candidate) => isComparableCandidate(candidate, input.canonicalProduct, priceBasis, minimumSourceConfidence))
    .sort((left, right) => compareCandidates(left, right, priceBasis))
    .map((candidate, index, candidates): CrossCategoryCheapestSource => {
      const effectivePrice = comparablePrice(candidate, priceBasis);
      const nextPrice = candidates[index + 1] ? comparablePrice(candidates[index + 1]!, priceBasis) : null;
      const savingsVsNext = nextPrice === null ? 0 : roundMoney(nextPrice - effectivePrice);
      return {
        ...candidate,
        rank: index + 1,
        effectivePrice: roundMoney(effectivePrice),
        priceBasis,
        savingsVsNext,
        savingsVsNextPercent: nextPrice && nextPrice > 0 ? roundMoney((savingsVsNext / nextPrice) * 100) : 0
      };
    });

  const retailerTypes = [...new Set(rows.map((row) => row.retailerType))].sort();
  const cheapest = rows[0] ?? null;

  return {
    status: cheapest ? 'priced' : 'not_found',
    canonicalProduct: input.canonicalProduct,
    cheapest,
    rows,
    coverage: {
      sourceCount: rows.length,
      retailerTypes,
      varietySourceCount: rows.filter((row) => row.retailerType === 'variety').length,
      rejectedSourceCount: input.candidates.length - rows.length
    },
    badgeLabel: cheapest
      ? `Best price ${formatMoney(cheapest.effectivePrice, cheapest.currency)} at ${cheapest.storeName ?? cheapest.chainName ?? cheapest.chainId}`
      : 'No exact cross-category price found',
    guardrails: [
      'Compares exact canonical product ids, declared equivalents, or matching SKU/EAN values only.',
      'Includes grocery and non-grocery retailer types such as variety stores when they carry the same SKU.',
      priceBasis === 'unit' ? 'Ranks by unitPrice when present.' : 'Ranks by current package price.'
    ]
  };
}

function isComparableCandidate(
  candidate: CrossCategoryPriceCandidate,
  canonicalProduct: CrossCategoryCanonicalProduct,
  priceBasis: CrossCategoryPriceBasis,
  minimumSourceConfidence: number
): boolean {
  if (!sameCanonicalProduct(candidate, canonicalProduct)) return false;
  if (candidate.inStock === false) return false;
  if (clamp(candidate.sourceConfidence ?? 1, 0, 1) < minimumSourceConfidence) return false;
  return Number.isFinite(comparablePrice(candidate, priceBasis)) && comparablePrice(candidate, priceBasis) > 0;
}

function sameCanonicalProduct(candidate: CrossCategoryPriceCandidate, canonicalProduct: CrossCategoryCanonicalProduct): boolean {
  if (candidate.productId === canonicalProduct.productId) return true;
  if (canonicalProduct.equivalentProductIds?.includes(candidate.productId)) return true;

  const canonicalSku = normalizeSku(canonicalProduct.sku);
  if (!canonicalSku) return false;
  return normalizeSku(candidate.sku) === canonicalSku || normalizeSku(candidate.canonicalSku) === canonicalSku;
}

function compareCandidates(
  left: CrossCategoryPriceCandidate,
  right: CrossCategoryPriceCandidate,
  priceBasis: CrossCategoryPriceBasis
): number {
  return comparablePrice(left, priceBasis) - comparablePrice(right, priceBasis)
    || retailerTypeRank(left.retailerType) - retailerTypeRank(right.retailerType)
    || (right.sourceConfidence ?? 1) - (left.sourceConfidence ?? 1)
    || left.chainId.localeCompare(right.chainId)
    || left.productId.localeCompare(right.productId);
}

function comparablePrice(candidate: CrossCategoryPriceCandidate, priceBasis: CrossCategoryPriceBasis): number {
  if (priceBasis === 'unit' && candidate.unitPrice !== null && candidate.unitPrice !== undefined) return candidate.unitPrice;
  return candidate.price;
}

function retailerTypeRank(retailerType: CrossCategoryRetailerType): number {
  if (retailerType === 'grocery') return 0;
  if (retailerType === 'variety') return 1;
  return 2;
}

function normalizeSku(value: string | undefined): string {
  return (value ?? '').replace(/[^0-9A-Za-z]+/g, '').toLocaleUpperCase('sv-SE');
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function formatMoney(value: number, currency = 'SEK'): string {
  return `${value.toFixed(2)} ${currency}`;
}
