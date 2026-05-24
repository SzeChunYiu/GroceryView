import { axfoodProducts, type AxfoodProduct, type ChainPrice } from './axfood-products';
import { dbSiteSnapshotGeneratedAt } from './generated/db-site-products';
import { dbSiteCompareStoreCapabilities, dbSiteIngestedOverridesGeneratedAt } from './generated/db-site-ingested-overrides';
import { commodityComparisonForProduct } from './verified-data';

export const COMPARE_CHAIN_ORDER = [
  { id: 'ica', label: 'ICA' },
  { id: 'willys', label: 'Willys' },
  { id: 'coop', label: 'Coop' }
] as const;

export type CompareChainId = (typeof COMPARE_CHAIN_ORDER)[number]['id'];

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

export type ChainCompareStoreCapability = {
  chainId: string;
  chainName: string;
  canCompare: boolean;
  evidenceUpdatedAt: string | null;
  generatedAt: string | null;
  rowCount: number;
  source: string;
};

export type NoChainCompareState = {
  title: string;
  description: string;
  activeFilters: string;
  capabilitySource: string;
  evidenceUpdatedAt: string | null;
  generatedAt: string | null;
  capabilities: ChainCompareStoreCapability[];
  guardrails: string[];
};

export type ChainComparisonTable = {
  requestedIds: string[];
  missingProductIds: string[];
  products: ChainCompareProductRow[];
  sourceLabel: string;
  generatedAt: string | null;
  noChainState: NoChainCompareState;
};

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

function comparePackagedProductRow(requestedId: string, product: AxfoodProduct): ChainCompareProductRow {
  const cells = COMPARE_CHAIN_ORDER.map((chain) => {
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

function compareCommodityProductRow(requestedId: string, product: AxfoodProduct, comparison: NonNullable<ReturnType<typeof commodityComparisonForProduct>>): ChainCompareProductRow {
  const rowsByChain = new Map(comparison.rows.map((row) => [row.chainId, row]));
  const cells = COMPARE_CHAIN_ORDER.map((chain) => {
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

function compareProductRow(requestedId: string, product: AxfoodProduct): ChainCompareProductRow {
  const commodityComparison = commodityComparisonForProduct(product.slug);
  if (commodityComparison?.status === 'priced') return compareCommodityProductRow(requestedId, product, commodityComparison);
  return comparePackagedProductRow(requestedId, product);
}

function newestTimestamp(values: Array<string | null | undefined>): string | null {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).sort().at(-1) ?? null;
}

function compareStoreCapabilities(): ChainCompareStoreCapability[] {
  if (dbSiteCompareStoreCapabilities.length > 0) {
    return dbSiteCompareStoreCapabilities.map((capability) => ({
      chainId: capability.chainId,
      chainName: capability.chainName,
      canCompare: capability.canCompare,
      evidenceUpdatedAt: capability.evidenceUpdatedAt,
      generatedAt: capability.generatedAt,
      rowCount: capability.rowCount,
      source: capability.source
    }));
  }

  return COMPARE_CHAIN_ORDER.map((chain) => ({
    chainId: chain.id,
    chainName: chain.label,
    canCompare: false,
    evidenceUpdatedAt: dbSiteSnapshotGeneratedAt,
    generatedAt: dbSiteIngestedOverridesGeneratedAt ?? dbSiteSnapshotGeneratedAt,
    rowCount: 0,
    source: 'fallback compare chain order; production builds can replace dbSiteCompareStoreCapabilities from packages/db evidence'
  }));
}

function buildNoChainCompareState(requestedIds: string[], missingProductIds: string[]): NoChainCompareState {
  const capabilities = compareStoreCapabilities();
  const hasGeneratedCapabilities = dbSiteCompareStoreCapabilities.length > 0;
  const evidenceUpdatedAt = newestTimestamp(capabilities.map((capability) => capability.evidenceUpdatedAt));
  const generatedAt = newestTimestamp(capabilities.map((capability) => capability.generatedAt)) ?? dbSiteIngestedOverridesGeneratedAt ?? dbSiteSnapshotGeneratedAt;
  const coveredChains = capabilities.filter((capability) => capability.canCompare && capability.rowCount > 0);
  return {
    title: coveredChains.length > 0 ? 'No requested products matched comparable chain rows' : 'No chain clears compare coverage yet',
    description: hasGeneratedCapabilities
      ? 'Generated compare-store capabilities were loaded, but the active product filters did not match a chain-comparable row.'
      : 'Local fallback capabilities are active; production DB exports can add chain evidence timestamps before the compare page renders.',
    activeFilters: requestedIds.length > 0 ? requestedIds.join(', ') : 'No product filters supplied',
    capabilitySource: hasGeneratedCapabilities ? 'dbSiteCompareStoreCapabilities' : 'fallback compare chain order',
    evidenceUpdatedAt,
    generatedAt,
    capabilities,
    guardrails: [
      'No-chain states do not infer product matches from names or missing chain rows.',
      'Capability timestamps come from generated DB evidence when dbSiteCompareStoreCapabilities is present.',
      missingProductIds.length > 0
        ? `Unmatched requested ids stay explicit: ${missingProductIds.join(', ')}`
        : 'Add product slugs or retailer product ids to evaluate chain coverage.'
    ]
  };
}

export function buildChainComparisonTable(
  productsParam: string | string[] | null | undefined,
  products: readonly AxfoodProduct[] = axfoodProducts
): ChainComparisonTable {
  const requestedIds = parseCompareProductsParam(productsParam);
  const byId = productLookup(products);
  const rows: ChainCompareProductRow[] = [];
  const missingProductIds: string[] = [];

  for (const requestedId of requestedIds) {
    const product = byId.get(requestedId);
    if (!product) {
      missingProductIds.push(requestedId);
      continue;
    }
    rows.push(compareProductRow(requestedId, product));
  }

  return {
    requestedIds,
    missingProductIds,
    products: rows,
    sourceLabel: dbSiteSnapshotGeneratedAt
      ? 'postgres.latest_prices/observations via packages/db site snapshot'
      : 'local bundled chain catalogue; production builds prefer packages/db snapshot rows',
    generatedAt: dbSiteIngestedOverridesGeneratedAt ?? dbSiteSnapshotGeneratedAt,
    noChainState: buildNoChainCompareState(requestedIds, missingProductIds)
  };
}
