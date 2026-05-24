import { COMMODITIES, type ComparableUnit, type Commodity } from '@groceryview/catalog';
import { compareCommodityUnitPrices, type CommodityPriceObservation } from '@groceryview/core';
import { axfoodProducts } from './axfood-products';

type AxfoodProduct = (typeof axfoodProducts)[number];

const SNAPSHOT_RETRIEVED_LABEL = '20-21 May 2026';

const commodityAliasMatchers: Record<string, RegExp[]> = {
  tomato: [/tomat/i],
  cucumber: [/gurka/i],
  carrot: [/morot/i],
  'yellow-onion': [/gul\s*lök|lök\s+gul/i],
  potato: [/potatis/i],
  'bell-pepper': [/paprika/i],
  'iceberg-lettuce': [/isberg|salladskål/i],
  banana: [/banan/i],
  apple: [/äpple/i],
  'beef-mince': [/nötfärs/i],
  'mixed-mince': [/blandfärs/i],
  'pork-mince': [/fläskfärs/i],
  'chicken-breast': [/kycklingfilé|bröstfilé/i],
  'chicken-thigh': [/kyckling\s*lårfilé/i],
  'whole-chicken': [/hel\s+kyckling/i],
  'pork-chop': [/fläskkotlett/i],
  salmon: [/\blax\b/i],
  eggs: [/ägg/i],
  milk: [/mjölk/i],
  rice: [/\bris\b/i],
  pasta: [/pasta|spaghetti/i]
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function commodityForAxfoodProduct(product: AxfoodProduct): Commodity | null {
  const haystack = `${product.name} ${product.brand} ${product.subline}`.normalize('NFC');
  return COMMODITIES.find((commodity) => commodityAliasMatchers[commodity.slug]?.some((matcher) => matcher.test(haystack))) ?? null;
}

function comparableUnitFromPriceUnit(priceUnit: string | null | undefined): ComparableUnit | null {
  const normalized = priceUnit?.toLowerCase() ?? '';
  if (normalized.includes('kg')) return 'kg';
  if (normalized.includes('/l') || normalized.includes('liter')) return 'l';
  if (normalized.includes('/st') || normalized.includes('styck')) return 'st';
  return null;
}

function chainDisplayName(chainId: string) {
  if (chainId === 'hemkop') return 'Hemköp';
  if (chainId === 'willys') return 'Willys';
  return chainId.charAt(0).toUpperCase() + chainId.slice(1);
}

function commodityObservationConfidence(product: AxfoodProduct, commodity: Commodity, unit: ComparableUnit) {
  const nameMatchesCanonical = product.name.toLowerCase().includes(commodity.nameSv.toLowerCase().split(' ')[0] ?? commodity.nameSv.toLowerCase());
  const hasUnitPriceCode = product.code.endsWith('_KG') || Object.values(product.chains).some((row) => row.priceUnit?.toLowerCase().includes(`/${unit}`));
  return clamp((nameMatchesCanonical ? 0.12 : 0) + (hasUnitPriceCode ? 0.68 : 0.52) + Math.min(product.inChains.length, 2) * 0.04, 0, 0.92);
}

export const commodityPriceObservations: CommodityPriceObservation[] = axfoodProducts.flatMap((product) => {
  const commodity = commodityForAxfoodProduct(product);
  if (!commodity) return [];

  return Object.entries(product.chains).flatMap(([chainId, row]) => {
    const comparableUnit = comparableUnitFromPriceUnit(row.priceUnit);
    if (comparableUnit !== commodity.comparableUnit || typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price <= 0) return [];
    return [{
      commodityId: commodity.slug,
      commodityName: commodity.nameSv,
      productId: product.slug,
      productName: product.name,
      chainId,
      chainName: chainDisplayName(chainId),
      unitPrice: row.price,
      comparableUnit,
      sourceConfidence: commodityObservationConfidence(product, commodity, comparableUnit),
      observedAt: SNAPSHOT_RETRIEVED_LABEL,
      variant: product.subline || product.brand || undefined,
      isOrganic: product.labels.includes('ecological') || product.labels.includes('eu_ecological'),
      originCountry: product.labels.includes('swedish_flag') || product.labels.includes('from_sweden') ? 'SE' : undefined
    }];
  });
});

export const commodityComparisonReports = COMMODITIES.map((commodity) => compareCommodityUnitPrices({
  commodityId: commodity.slug,
  commodityName: commodity.nameSv,
  comparableUnit: commodity.comparableUnit,
  observations: commodityPriceObservations,
  minimumConfidence: 0.6
}));

export function commodityComparisonForProduct(slug: string) {
  const product = axfoodProducts.find((candidate) => candidate.slug === slug);
  if (!product) return null;
  const commodity = commodityForAxfoodProduct(product);
  if (!commodity) return null;
  return commodityComparisonReports.find((comparison) => comparison.commodityId === commodity.slug) ?? null;
}
