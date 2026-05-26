import type { AxfoodProduct } from './axfood-products';
import { packageEvidenceFromText, type PackageEvidence } from './normalization';

export type SinglePortionWasteRisk = 'low' | 'medium' | 'high';

export type SinglePortionDeal = {
  brand: string;
  categoryLabel: string;
  chainLabel: string;
  confidenceLabel: string;
  imageUrl: string | null;
  packageLabel: string;
  packageSizeLabel: string;
  perServingCost: number;
  perServingCostLabel: string;
  productName: string;
  productSlug: string;
  servingCount: number;
  servingLabel: string;
  sourceLabel: string;
  totalPriceLabel: string;
  wasteRisk: SinglePortionWasteRisk;
  wasteRiskLabel: string;
  cheaperAlternative: {
    perServingCostLabel: string;
    productName: string;
    productSlug: string;
    totalPriceLabel: string;
  } | null;
};

type SinglePortionCandidate = {
  evidence: PackageEvidence;
  product: AxfoodProduct;
  perServingCost: number;
  servingCount: number;
  servingSizeLabel: string;
  wasteRisk: SinglePortionWasteRisk;
};

export type BuildSinglePortionDealFinderOptions = {
  limit?: number;
  maxServings?: number;
};

const DEFAULT_MAX_SERVINGS = 6;
const SHELF_STABLE_CATEGORIES = ['skafferi', 'brod', 'godis', 'dryck', 'fryst'];
const SHORT_LIFE_CATEGORIES = ['frukt', 'gront', 'mejeri', 'kott', 'fisk'];

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function packageSizeLabel(evidence: PackageEvidence) {
  if (evidence.packageUnit === 'g' && evidence.packageSize >= 1000) return `${(evidence.packageSize / 1000).toLocaleString('sv-SE')} kg`;
  if (evidence.packageUnit === 'ml' && evidence.packageSize >= 1000) return `${(evidence.packageSize / 1000).toLocaleString('sv-SE')} l`;
  return `${evidence.packageSize.toLocaleString('sv-SE')} ${evidence.packageUnit === 'piece' ? 'st' : evidence.packageUnit}`;
}

function servingSize(evidence: PackageEvidence) {
  if (evidence.packageUnit === 'g') return { amount: 125, label: '125 g serving' };
  if (evidence.packageUnit === 'ml') return { amount: 250, label: '250 ml serving' };
  return { amount: 1, label: '1 piece serving' };
}

function categoryHas(category: string, terms: string[]) {
  const normalized = category.toLocaleLowerCase('sv-SE');
  return terms.some((term) => normalized.includes(term));
}

function wasteRiskFor(product: AxfoodProduct, evidence: PackageEvidence, servingCount: number): SinglePortionWasteRisk {
  if (categoryHas(product.category, SHELF_STABLE_CATEGORIES)) return servingCount <= 6 ? 'low' : 'medium';
  if (!categoryHas(product.category, SHORT_LIFE_CATEGORIES)) return servingCount <= 4 ? 'low' : 'medium';
  if (servingCount <= 2) return 'low';
  if (servingCount <= 4 && evidence.packageSize <= 600) return 'medium';
  return 'high';
}

function wasteRiskLabel(risk: SinglePortionWasteRisk) {
  if (risk === 'low') return 'Low waste risk';
  if (risk === 'medium') return 'Medium waste risk: plan leftovers';
  return 'High waste risk for one person';
}

function candidateFor(product: AxfoodProduct): SinglePortionCandidate | null {
  const evidence = packageEvidenceFromText(product.subline);
  if (!evidence || product.lowestPrice <= 0) return null;
  const serving = servingSize(evidence);
  const servingCount = Math.max(1, Math.ceil(evidence.packageSize / serving.amount));
  const perServingCost = product.lowestPrice / servingCount;
  const wasteRisk = wasteRiskFor(product, evidence, servingCount);
  return {
    evidence,
    product,
    perServingCost,
    servingCount,
    servingSizeLabel: serving.label,
    wasteRisk
  };
}

function confidenceLabel(candidate: SinglePortionCandidate) {
  const chainCount = candidate.product.inChains.length;
  return chainCount >= 2
    ? `High confidence: ${chainCount} chain rows and parseable package-size evidence.`
    : 'Partial confidence: package-size evidence is parseable, but chain coverage is limited.';
}

function sourceLabel(candidate: SinglePortionCandidate) {
  return `Axfood chain price snapshot; per-serving assumes ${candidate.servingSizeLabel} and does not infer household appetite or live stock.`;
}

function toDeal(candidate: SinglePortionCandidate, candidates: SinglePortionCandidate[], categoryLabelFor: (category: string) => string): SinglePortionDeal {
  const cheaperAlternative = candidates
    .filter((other) =>
      other.product.slug !== candidate.product.slug
      && other.product.category === candidate.product.category
      && other.evidence.packageUnit === candidate.evidence.packageUnit
      && other.wasteRisk !== 'high'
      && other.perServingCost < candidate.perServingCost
    )
    .sort((left, right) => left.perServingCost - right.perServingCost || left.servingCount - right.servingCount)[0] ?? null;

  return {
    brand: candidate.product.brand || 'Brand not reported',
    categoryLabel: categoryLabelFor(candidate.product.category),
    chainLabel: candidate.product.lowestChain,
    confidenceLabel: confidenceLabel(candidate),
    imageUrl: candidate.product.image,
    packageLabel: candidate.product.subline,
    packageSizeLabel: packageSizeLabel(candidate.evidence),
    perServingCost: Math.round(candidate.perServingCost * 100) / 100,
    perServingCostLabel: `${formatSek(candidate.perServingCost)} per serving`,
    productName: candidate.product.name,
    productSlug: candidate.product.slug,
    servingCount: candidate.servingCount,
    servingLabel: `${candidate.servingCount} x ${candidate.servingSizeLabel}`,
    sourceLabel: sourceLabel(candidate),
    totalPriceLabel: formatSek(candidate.product.lowestPrice),
    wasteRisk: candidate.wasteRisk,
    wasteRiskLabel: wasteRiskLabel(candidate.wasteRisk),
    cheaperAlternative: cheaperAlternative ? {
      perServingCostLabel: `${formatSek(cheaperAlternative.perServingCost)} per serving`,
      productName: cheaperAlternative.product.name,
      productSlug: cheaperAlternative.product.slug,
      totalPriceLabel: formatSek(cheaperAlternative.product.lowestPrice)
    } : null
  };
}

export function buildSinglePortionDealFinder(
  catalog: readonly AxfoodProduct[],
  categoryLabelFor: (category: string) => string,
  options: BuildSinglePortionDealFinderOptions = {}
): SinglePortionDeal[] {
  const maxServings = options.maxServings ?? DEFAULT_MAX_SERVINGS;
  const candidates = catalog
    .map(candidateFor)
    .filter((candidate): candidate is SinglePortionCandidate => candidate !== null);

  return candidates
    .filter((candidate) => candidate.servingCount <= maxServings && candidate.wasteRisk !== 'high')
    .map((candidate) => toDeal(candidate, candidates, categoryLabelFor))
    .sort((left, right) => {
      const costDelta = left.perServingCost - right.perServingCost;
      if (costDelta !== 0) return costDelta;
      const servingDelta = left.servingCount - right.servingCount;
      if (servingDelta !== 0) return servingDelta;
      if (left.cheaperAlternative === null && right.cheaperAlternative !== null) return -1;
      if (left.cheaperAlternative !== null && right.cheaperAlternative === null) return 1;
      return left.productName.localeCompare(right.productName, 'sv-SE');
    })
    .slice(0, options.limit ?? 6);
}
