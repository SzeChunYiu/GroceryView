import { axfoodProducts, type AxfoodProduct, type ChainPrice } from './axfood-products';
import { dbSiteSnapshotGeneratedAt } from './generated/db-site-products';
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

export type ChainComparisonTable = {
  requestedIds: string[];
  missingProductIds: string[];
  products: ChainCompareProductRow[];
  sourceLabel: string;
  generatedAt: string | null;
};

export type NoChainStateFreshness = {
  evidenceUpdatedAt: string | null;
  staleAfterDays: number;
  ageDays: number | null;
  isStale: boolean;
  warningLabel: string;
};

const NO_CHAIN_STALE_AFTER_DAYS = 7;

export const noChainState = {
  title: 'Compare chain capability',
  evidenceUpdatedAt: dbSiteSnapshotGeneratedAt,
  staleAfterDays: NO_CHAIN_STALE_AFTER_DAYS,
  missingLabel: 'No generated chain snapshot is available, so missing chain rows may be genuinely absent or simply not exported yet.',
  staleLabel: 'Compare chain evidence is stale: refresh generated exports before treating missing chain rows as genuinely unavailable.',
  freshLabel: 'Compare chain evidence is fresh enough to distinguish missing chain coverage from outdated exports.'
} as const;

export function getNoChainStateFreshness(referenceDate: Date = new Date()): NoChainStateFreshness {
  if (!noChainState.evidenceUpdatedAt) {
    return {
      evidenceUpdatedAt: null,
      staleAfterDays: noChainState.staleAfterDays,
      ageDays: null,
      isStale: true,
      warningLabel: noChainState.missingLabel
    };
  }

  const evidenceTime = Date.parse(noChainState.evidenceUpdatedAt);
  const ageDays = Number.isFinite(evidenceTime)
    ? Math.floor((referenceDate.getTime() - evidenceTime) / 86_400_000)
    : null;
  const isStale = ageDays === null || ageDays > noChainState.staleAfterDays;

  return {
    evidenceUpdatedAt: noChainState.evidenceUpdatedAt,
    staleAfterDays: noChainState.staleAfterDays,
    ageDays,
    isStale,
    warningLabel: isStale ? noChainState.staleLabel : noChainState.freshLabel
  };
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
    generatedAt: dbSiteSnapshotGeneratedAt
  };
}
