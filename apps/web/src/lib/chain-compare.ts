import { axfoodProducts, type AxfoodProduct, type ChainPrice } from './axfood-products';
import { dbSiteCompareStoreCapabilities } from './generated/db-site-ingested-overrides';
import { dbSiteSnapshotGeneratedAt } from './generated/db-site-products';
import { commodityComparisonForProduct } from './verified-data';

export const COMPARE_CHAIN_ORDER = dbSiteCompareStoreCapabilities.map((capability) => ({
  id: capability.chainId,
  label: capability.label
}));

export type CompareChainId = (typeof COMPARE_CHAIN_ORDER)[number]['id'];

export type ChainComparisonStoreFilters = {
  coupons?: boolean;
  delivery?: boolean;
  pickup?: boolean;
};

export const compareStoreCapabilities = dbSiteCompareStoreCapabilities;

export type ChainCompareCell = {
  chainId: CompareChainId;
  chainName: string;
  price: number | null;
  priceText: string;
  unitLabel: string;
  status: 'priced' | 'missing';
  sourceUrl: string;
  productSlug: string | null;
  productName: string | null;
  sourceConfidence: number | null;
};

export type ChainCompareProductRow = {
  requestedId: string;
  productId: string;
  productSlug: string;
  productName: string;
  brand: string;
  packageLabel: string;
  matchType: 'packaged_barcode' | 'commodity_alias';
  matchLabel: string;
  confidenceLabel: string;
  cells: ChainCompareCell[];
  bestChainName: string;
  bestPriceText: string;
};

export type ChainComparisonTable = {
  requestedIds: string[];
  missingProductIds: string[];
  products: ChainCompareProductRow[];
  storeFilters: {
    coupons: boolean;
    delivery: boolean;
    pickup: boolean;
    activeLabels: string[];
    visibleChains: Array<{ id: CompareChainId; label: string; evidenceLabel: string; evidenceUpdatedAt: string | null }>;
  };
  sourceLabel: string;
  generatedAt: string | null;
};

function normalizedStoreFilters(filters: ChainComparisonStoreFilters = {}) {
  const normalized = {
    coupons: filters.coupons === true,
    delivery: filters.delivery === true,
    pickup: filters.pickup === true
  };
  return {
    ...normalized,
    activeLabels: [
      normalized.coupons ? 'available coupons' : null,
      normalized.delivery ? 'home delivery' : null,
      normalized.pickup ? 'pickup' : null
    ].filter((label): label is string => label !== null)
  };
}

function visibleCompareChains(filters: ReturnType<typeof normalizedStoreFilters>) {
  return compareStoreCapabilities
    .filter((chain) => {
      if (filters.coupons && !chain.coupons) return false;
      if (filters.delivery && !chain.delivery) return false;
      if (filters.pickup && !chain.pickup) return false;
      return true;
    })
    .map((chain) => ({
      id: chain.chainId,
      label: chain.label,
      evidenceLabel: chain.evidenceLabel,
      evidenceUpdatedAt: chain.evidenceUpdatedAt
    }));
}

function normalizeCompareId(value: string): string {
  return value.trim().toLowerCase();
}

export function parseCompareProductsParam(input: string | string[] | null | undefined): string[] {
  const productsParam = Array.isArray(input) ? input.join(',') : (input ?? '');
  const seen = new Set<string>();
  return productsParam.split(',')
    .map(normalizeCompareId)
    .filter((value) => value.length > 0)
    .filter((value) => {
      if (seen.has(value)) return false;
      seen.add(value);
      return true;
    })
    .slice(0, 6);
}

function productLookup(products: readonly AxfoodProduct[]): Map<string, AxfoodProduct> {
  const lookup = new Map<string, AxfoodProduct>();
  for (const product of products) {
    lookup.set(normalizeCompareId(product.slug), product);
    lookup.set(normalizeCompareId(product.code), product);
  }
  return lookup;
}

function formatMissingCell(chainName: string, chainId: CompareChainId): ChainCompareCell {
  return {
    chainId,
    chainName,
    price: null,
    priceText: 'No DB price row',
    unitLabel: 'packages/db row missing',
    status: 'missing',
    sourceUrl: '',
    productSlug: null,
    productName: null,
    sourceConfidence: null
  };
}

function formatPackagedPricedCell(chainName: string, chainId: CompareChainId, product: AxfoodProduct, price: ChainPrice): ChainCompareCell {
  if (typeof price.price !== 'number' || !Number.isFinite(price.price)) return formatMissingCell(chainName, chainId);
  return {
    chainId,
    chainName,
    price: price.price,
    priceText: price.priceText || `${price.price.toLocaleString('sv-SE')} kr`,
    unitLabel: price.priceUnit || 'kr/st',
    status: 'priced',
    sourceUrl: price.url,
    productSlug: product.slug,
    productName: product.name,
    sourceConfidence: null
  };
}

function formatCommodityMissingCell(chainName: string, chainId: CompareChainId, comparableUnit: string): ChainCompareCell {
  return {
    ...formatMissingCell(chainName, chainId),
    priceText: 'No commodity row',
    unitLabel: `No confidence-cleared kr/${comparableUnit} evidence`
  };
}

function formatCommodityPricedCell(
  chainName: string,
  chainId: CompareChainId,
  comparableUnit: string,
  row: NonNullable<ReturnType<typeof commodityComparisonForProduct>>['rows'][number]
): ChainCompareCell {
  return {
    chainId,
    chainName,
    price: row.unitPrice,
    priceText: `${row.unitPrice.toLocaleString('sv-SE')} kr`,
    unitLabel: `commodity/alias kr/${comparableUnit}`,
    status: 'priced',
    sourceUrl: '',
    productSlug: row.productId,
    productName: row.productName,
    sourceConfidence: row.sourceConfidence
  };
}

function comparePackagedProductRow(requestedId: string, product: AxfoodProduct, chains = COMPARE_CHAIN_ORDER): ChainCompareProductRow {
  const cells = chains.map((chain) => {
    const price = product.chains[chain.id];
    return price ? formatPackagedPricedCell(chain.label, chain.id, product, price) : formatMissingCell(chain.label, chain.id);
  });
  const pricedCells = cells.filter((cell) => cell.price !== null);
  const bestCell = pricedCells.sort((left, right) => (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY))[0];

  return {
    requestedId,
    productId: product.code,
    productSlug: product.slug,
    productName: product.name,
    brand: product.brand,
    packageLabel: product.subline,
    matchType: 'packaged_barcode',
    matchLabel: 'Packaged/barcode match',
    confidenceLabel: `${pricedCells.length} exact chain price row(s); ranked by reported pack price.`,
    cells,
    bestChainName: bestCell?.chainName ?? 'Awaiting DB row',
    bestPriceText: bestCell?.priceText ?? 'No chain price yet'
  };
}

function compareCommodityProductRow(requestedId: string, product: AxfoodProduct, comparison: NonNullable<ReturnType<typeof commodityComparisonForProduct>>, chains = COMPARE_CHAIN_ORDER): ChainCompareProductRow {
  const rowsByChain = new Map(comparison.rows.map((row) => [row.chainId, row]));
  const cells = chains.map((chain) => {
    const row = rowsByChain.get(chain.id);
    return row
      ? formatCommodityPricedCell(chain.label, chain.id, comparison.comparableUnit, row)
      : formatCommodityMissingCell(chain.label, chain.id, comparison.comparableUnit);
  });
  const pricedCells = cells.filter((cell) => cell.price !== null);
  const bestCell = pricedCells.sort((left, right) => (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY))[0];

  return {
    requestedId,
    productId: product.code,
    productSlug: product.slug,
    productName: product.name,
    brand: product.brand,
    packageLabel: product.subline,
    matchType: 'commodity_alias',
    matchLabel: `${comparison.commodityName} commodity/alias match`,
    confidenceLabel: comparison.confidenceLabel,
    cells,
    bestChainName: bestCell?.chainName ?? 'Awaiting commodity coverage',
    bestPriceText: bestCell ? `${bestCell.priceText} / ${comparison.comparableUnit}` : `No kr/${comparison.comparableUnit} commodity price yet`
  };
}

function compareProductRow(requestedId: string, product: AxfoodProduct, chains = COMPARE_CHAIN_ORDER): ChainCompareProductRow {
  const commodityComparison = commodityComparisonForProduct(product.slug);
  if (commodityComparison?.status === 'priced') return compareCommodityProductRow(requestedId, product, commodityComparison, chains);
  return comparePackagedProductRow(requestedId, product, chains);
}

export function buildChainComparisonTable(
  productsParam: string | string[] | null | undefined,
  products: readonly AxfoodProduct[] = axfoodProducts,
  storeFiltersInput: ChainComparisonStoreFilters = {}
): ChainComparisonTable {
  const requestedIds = parseCompareProductsParam(productsParam);
  const byId = productLookup(products);
  const rows: ChainCompareProductRow[] = [];
  const missingProductIds: string[] = [];
  const storeFilters = normalizedStoreFilters(storeFiltersInput);
  const chains = visibleCompareChains(storeFilters);

  for (const requestedId of requestedIds) {
    const product = byId.get(requestedId);
    if (!product) {
      missingProductIds.push(requestedId);
      continue;
    }
    rows.push(compareProductRow(requestedId, product, chains));
  }

  return {
    requestedIds,
    missingProductIds,
    products: rows,
    storeFilters: {
      coupons: storeFilters.coupons,
      delivery: storeFilters.delivery,
      pickup: storeFilters.pickup,
      activeLabels: storeFilters.activeLabels,
      visibleChains: chains
    },
    sourceLabel: dbSiteSnapshotGeneratedAt
      ? 'postgres.latest_prices/observations via packages/db site snapshot'
      : 'local bundled chain catalogue; production builds prefer packages/db snapshot rows',
    generatedAt: dbSiteSnapshotGeneratedAt
  };
}
