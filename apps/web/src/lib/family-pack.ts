import type { AxfoodProduct } from './axfood-products';
import { defaultLocale, formatLocalizedUnitPrice } from './i18n';
import { packageEvidenceFromText, type PackageEvidence } from './normalization';

export type FamilyPackStorageFit = 'freezer_ready' | 'shelf_stable' | 'fridge_plan' | 'short_life' | 'check_storage';
export type FamilyPackVerdict = 'bulk_cheaper' | 'standard_cheaper';

export type FamilyPackComparison = {
  baseline: FamilyPackProductSummary;
  bulk: FamilyPackProductSummary;
  categoryLabel: string;
  confidenceLabel: string;
  sourceLabel: string;
  storageDetail: string;
  storageFit: FamilyPackStorageFit;
  largerPackWarningLabel: string | null;
  storageLabel: string;
  totalSpendDeltaLabel: string;
  unitPriceDeltaPercent: number;
  unitPriceDeltaLabel: string;
  verdict: FamilyPackVerdict;
  verdictLabel: string;
};

export type FamilyPackProductSummary = {
  brand: string;
  packageLabel: string;
  packageSizeLabel: string;
  price: number;
  priceLabel: string;
  productName: string;
  slug: string;
  unitPrice: number;
  unitPriceLabel: string;
};

type ProductWithEvidence = {
  evidence: PackageEvidence;
  product: AxfoodProduct;
  unitPrice: number;
};

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', {
    currency: 'SEK',
    maximumFractionDigits: 2,
    style: 'currency'
  }).format(value);
}

function comparableUnitFor(evidence: PackageEvidence) {
  if (evidence.packageUnit === 'g') return 'kg';
  if (evidence.packageUnit === 'ml') return 'l';
  return 'piece';
}

function normalizedUnitPrice(product: AxfoodProduct, evidence: PackageEvidence) {
  if (evidence.packageUnit === 'piece') return product.lowestPrice / evidence.packageSize;
  return (product.lowestPrice / evidence.packageSize) * 1000;
}

function packageSizeLabel(evidence: PackageEvidence) {
  if (evidence.packageUnit === 'g' && evidence.packageSize >= 1000) return `${(evidence.packageSize / 1000).toLocaleString('sv-SE')} kg`;
  if (evidence.packageUnit === 'ml' && evidence.packageSize >= 1000) return `${(evidence.packageSize / 1000).toLocaleString('sv-SE')} l`;
  return `${evidence.packageSize.toLocaleString('sv-SE')} ${evidence.packageUnit === 'piece' ? 'st' : evidence.packageUnit}`;
}

function productSummary(row: ProductWithEvidence): FamilyPackProductSummary {
  const unit = comparableUnitFor(row.evidence);
  return {
    brand: row.product.brand || 'Brand not reported',
    packageLabel: row.product.subline,
    packageSizeLabel: packageSizeLabel(row.evidence),
    price: row.product.lowestPrice,
    priceLabel: formatSek(row.product.lowestPrice),
    productName: row.product.name,
    slug: row.product.slug,
    unitPrice: row.unitPrice,
    unitPriceLabel: formatLocalizedUnitPrice(row.unitPrice, {
      currency: 'SEK',
      locale: defaultLocale,
      unit
    })
  };
}

function storageFitFor(product: AxfoodProduct): Pick<FamilyPackComparison, 'storageDetail' | 'storageFit' | 'storageLabel'> {
  const category = product.category.toLocaleLowerCase('sv-SE');
  const name = `${product.name} ${product.subline}`.toLocaleLowerCase('sv-SE');

  if (category.includes('fryst') || name.includes('fryst')) {
    return {
      storageDetail: 'Source category or pack text marks this as frozen, so bulk value depends on available freezer space.',
      storageFit: 'freezer_ready',
      storageLabel: 'Freezer-ready'
    };
  }

  if (category.includes('skafferi') || category.includes('godis') || category.includes('dryck')) {
    return {
      storageDetail: 'Pantry-style category; shelf space is usually the main family-pack constraint.',
      storageFit: 'shelf_stable',
      storageLabel: 'Shelf-stable'
    };
  }

  if (category.includes('frukt') || category.includes('gront')) {
    return {
      storageDetail: 'Produce category; a cheaper unit price can still waste money if the pack is too large for the household.',
      storageFit: 'short_life',
      storageLabel: 'Short shelf life'
    };
  }

  if (category.includes('mejeri') || category.includes('kott') || category.includes('fisk')) {
    return {
      storageDetail: 'Chilled category; compare unit savings against fridge or freezer capacity before buying the larger pack.',
      storageFit: 'fridge_plan',
      storageLabel: 'Plan cold storage'
    };
  }

  return {
    storageDetail: 'Storage evidence is not explicit in the source row; check pack handling before choosing the larger spend.',
    storageFit: 'check_storage',
    storageLabel: 'Check storage'
  };
}

function withPackageEvidence(products: readonly AxfoodProduct[]) {
  return products.flatMap((product): ProductWithEvidence[] => {
    const evidence = packageEvidenceFromText(product.subline);
    if (!evidence || product.lowestPrice <= 0) return [];
    return [{
      evidence,
      product,
      unitPrice: normalizedUnitPrice(product, evidence)
    }];
  });
}

function comparisonFor(baseline: ProductWithEvidence, bulk: ProductWithEvidence, categoryLabel: string): FamilyPackComparison {
  const unitDeltaPercent = ((bulk.unitPrice - baseline.unitPrice) / baseline.unitPrice) * 100;
  const totalSpendDelta = bulk.product.lowestPrice - baseline.product.lowestPrice;
  const verdict: FamilyPackVerdict = unitDeltaPercent < 0 ? 'bulk_cheaper' : 'standard_cheaper';
  const storage = storageFitFor(bulk.product);

  return {
    baseline: productSummary(baseline),
    bulk: productSummary(bulk),
    categoryLabel,
    confidenceLabel: baseline.product.inChains.length > 1 && bulk.product.inChains.length > 1
      ? 'High confidence: exact Axfood chain rows and parseable package sizes for both SKUs.'
      : 'Partial confidence: package size parsed, but chain coverage is limited.',
    sourceLabel: 'Axfood chain price snapshot plus parsed package-size evidence; no live stock or household consumption rate is inferred.',
    ...storage,
    largerPackWarningLabel: verdict === 'standard_cheaper'
      ? 'Larger pack is not the best unit price; keep the smaller benchmark unless storage or meal-plan needs override the spend.'
      : null,
    totalSpendDeltaLabel: `${totalSpendDelta >= 0 ? '+' : ''}${formatSek(totalSpendDelta)} total spend`,
    unitPriceDeltaPercent: unitDeltaPercent,
    unitPriceDeltaLabel: `${unitDeltaPercent > 0 ? '+' : ''}${unitDeltaPercent.toFixed(1)}% unit price`,
    verdict,
    verdictLabel: verdict === 'bulk_cheaper' ? 'Bulk is cheaper per unit' : 'Larger pack not best unit price'
  };
}

export function familyPackComparisonsForProduct(
  product: AxfoodProduct,
  catalog: readonly AxfoodProduct[],
  categoryLabel: string,
  limit = 3
): FamilyPackComparison[] {
  const currentEvidence = packageEvidenceFromText(product.subline);
  if (!currentEvidence || product.lowestPrice <= 0) return [];

  const current: ProductWithEvidence = {
    evidence: currentEvidence,
    product,
    unitPrice: normalizedUnitPrice(product, currentEvidence)
  };
  const candidates = withPackageEvidence(catalog)
    .filter((candidate) =>
      candidate.product.slug !== product.slug
      && candidate.product.category === product.category
      && candidate.evidence.packageUnit === current.evidence.packageUnit
    );

  const largerPackRows = candidates
    .filter((candidate) => candidate.evidence.packageSize >= current.evidence.packageSize * 1.25)
    .map((candidate) => comparisonFor(current, candidate, categoryLabel));

  const smallerBenchmarkRows = candidates
    .filter((candidate) => candidate.evidence.packageSize <= current.evidence.packageSize * 0.8)
    .map((candidate) => comparisonFor(candidate, current, categoryLabel));

  return [...largerPackRows, ...smallerBenchmarkRows]
    .sort((left, right) => left.unitPriceDeltaPercent - right.unitPriceDeltaPercent || right.bulk.price - left.bulk.price)
    .slice(0, limit);
}

export function topFamilyPackComparisons(
  catalog: readonly AxfoodProduct[],
  categoryLabelFor: (category: string) => string,
  limit = 6
): FamilyPackComparison[] {
  return withPackageEvidence(catalog)
    .flatMap((row) => familyPackComparisonsForProduct(row.product, catalog, categoryLabelFor(row.product.category), 2))
    .filter((comparison, index, comparisons) =>
      comparisons.findIndex((candidate) => candidate.baseline.slug === comparison.baseline.slug && candidate.bulk.slug === comparison.bulk.slug) === index
    )
    .sort((left, right) => left.unitPriceDeltaPercent - right.unitPriceDeltaPercent || right.bulk.price - left.bulk.price)
    .slice(0, limit);
}
