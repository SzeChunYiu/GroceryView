import { axfoodProducts, type AxfoodProduct, type ChainPrice } from './axfood-products';
import { dbSiteSnapshotGeneratedAt } from './generated/db-site-products';
import { commodityComparisonForProduct } from './verified-data';

export const COMPARE_CHAIN_ORDER = [
  { id: 'ica', label: 'ICA' },
  { id: 'willys', label: 'Willys' },
  { id: 'coop', label: 'Coop' }
] as const;

export type CompareChainId = (typeof COMPARE_CHAIN_ORDER)[number]['id'];
export type ChainPriceComparisonMode = 'regular' | 'member' | 'coupon' | 'stacked';

export const CHAIN_PRICE_COMPARISON_MODES: Array<{ id: ChainPriceComparisonMode; label: string; guardrail: string }> = [
  { id: 'regular', label: 'Regular', guardrail: 'Public shelf/catalogue price.' },
  { id: 'member', label: 'Member', guardrail: 'Requires signed-in loyalty eligibility before a member price can be counted.' },
  { id: 'coupon', label: 'Coupon', guardrail: 'Requires an account-bound clipped coupon before savings can be counted.' },
  { id: 'stacked', label: 'Stacked', guardrail: 'Requires both eligible member price and clipped coupon evidence.' }
];

export type ChainPriceModeQuote = {
  mode: ChainPriceComparisonMode;
  price: number | null;
  priceText: string;
  status: 'priced' | 'missing' | 'account_required';
  guardrail: string;
};

export type ChainCompareCell = {
  chainId: CompareChainId;
  chainName: string;
  price: number | null;
  priceText: string;
  priceModes: ChainPriceModeQuote[];
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

export type BasketStoreSubstitutionExplanation = {
  productName: string;
  storeName: string;
  priceText: string;
  reason: string;
};

export type BasketStoreComparisonLine = {
  productId: string;
  productName: string;
  status: 'priced' | 'missing';
  priceText: string;
  unitLabel: string;
};

export type BasketStoreComparisonStore = {
  storeId: CompareChainId;
  storeName: string;
  rankLabel: string;
  total: number | null;
  totalText: string;
  availableCount: number;
  missingCount: number;
  coverageLabel: string;
  missingProductNames: string[];
  substitutions: BasketStoreSubstitutionExplanation[];
  lines: BasketStoreComparisonLine[];
};

export type BasketStoreComparison = {
  requestedIds: string[];
  itemCount: number;
  stores: BasketStoreComparisonStore[];
  sourceLabel: string;
  summary: string;
};

type CompareResetSearchParams = {
  products?: string | string[] | null | undefined;
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

export function buildCompareNoChainResetUrl(searchParams: CompareResetSearchParams = {}): string {
  const products = parseCompareProductsParam(searchParams.products);
  const productsQuery = products.map(encodeURIComponent).join(',');
  return productsQuery ? `/compare?products=${productsQuery}` : '/compare';
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
    priceModes: chainPriceModes(null, 'No DB price row'),
    unitLabel: 'packages/db row missing',
    status: 'missing',
    sourceUrl: '',
    productSlug: null,
    productName: null,
    sourceConfidence: null
  };
}

function chainPriceModes(regularPrice: number | null, regularPriceText: string): ChainPriceModeQuote[] {
  return CHAIN_PRICE_COMPARISON_MODES.map((mode) => {
    if (mode.id === 'regular') {
      return {
        mode: mode.id,
        price: regularPrice,
        priceText: regularPriceText,
        status: regularPrice === null ? 'missing' : 'priced',
        guardrail: mode.guardrail
      };
    }

    return {
      mode: mode.id,
      price: null,
      priceText: mode.id === 'stacked' ? 'Needs member + coupon evidence' : `Needs ${mode.id} evidence`,
      status: 'account_required',
      guardrail: mode.guardrail
    };
  });
}

function formatPackagedPricedCell(chainName: string, chainId: CompareChainId, product: AxfoodProduct, price: ChainPrice): ChainCompareCell {
  if (typeof price.price !== 'number' || !Number.isFinite(price.price)) return formatMissingCell(chainName, chainId);
  return {
    chainId,
    chainName,
    price: price.price,
    priceText: price.priceText || `${price.price.toLocaleString('sv-SE')} kr`,
    priceModes: chainPriceModes(price.price, price.priceText || `${price.price.toLocaleString('sv-SE')} kr`),
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
    priceModes: chainPriceModes(row.unitPrice, `${row.unitPrice.toLocaleString('sv-SE')} kr`),
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

function formatBasketSek(value: number): string {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 2 })} kr`;
}

export function buildBasketStoreComparison(
  productsParam: string | string[] | null | undefined,
  products: readonly AxfoodProduct[] = axfoodProducts
): BasketStoreComparison {
  const comparison = buildChainComparisonTable(productsParam, products);
  const rows = new Map<CompareChainId, Omit<BasketStoreComparisonStore, 'rankLabel' | 'totalText' | 'coverageLabel'>>();

  for (const chain of COMPARE_CHAIN_ORDER) {
    rows.set(chain.id, {
      storeId: chain.id,
      storeName: `${chain.label} nearby store`,
      total: 0,
      availableCount: 0,
      missingCount: comparison.missingProductIds.length,
      missingProductNames: [...comparison.missingProductIds],
      substitutions: [],
      lines: comparison.missingProductIds.map((productId) => ({
        productId,
        productName: productId,
        status: 'missing',
        priceText: 'Not in catalogue snapshot',
        unitLabel: 'No product match'
      }))
    });
  }

  for (const product of comparison.products) {
    const pricedCells = product.cells
      .filter((cell) => cell.status === 'priced' && cell.price !== null)
      .sort((left, right) => (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY));
    const cheapestCell = pricedCells[0];

    for (const cell of product.cells) {
      const store = rows.get(cell.chainId);
      if (!store) continue;

      if (cell.status === 'priced' && cell.price !== null) {
        store.total = (store.total ?? 0) + cell.price;
        store.availableCount += 1;
        store.lines.push({
          productId: product.productId,
          productName: product.productName,
          status: 'priced',
          priceText: cell.priceText,
          unitLabel: cell.unitLabel
        });

        if (cheapestCell && cheapestCell.chainId !== cell.chainId && cheapestCell.price !== null && cheapestCell.price < cell.price) {
          store.substitutions.push({
            productName: product.productName,
            storeName: cheapestCell.chainName,
            priceText: cheapestCell.priceText,
            reason: `Swap this basket line to ${cheapestCell.chainName} to save ${formatBasketSek(cell.price - cheapestCell.price)}.`
          });
        }
        continue;
      }

      store.missingCount += 1;
      store.missingProductNames.push(product.productName);
      store.lines.push({
        productId: product.productId,
        productName: product.productName,
        status: 'missing',
        priceText: cell.priceText,
        unitLabel: cell.unitLabel
      });

      if (cheapestCell) {
        store.substitutions.push({
          productName: product.productName,
          storeName: cheapestCell.chainName,
          priceText: cheapestCell.priceText,
          reason: `${cell.chainName} has no priced row for this basket line; fill it at ${cheapestCell.chainName} instead of estimating the missing item.`
        });
      }
    }
  }

  const itemCount = comparison.products.length + comparison.missingProductIds.length;
  const stores = [...rows.values()]
    .map((store) => ({
      ...store,
      total: store.availableCount > 0 ? Number((store.total ?? 0).toFixed(2)) : null
    }))
    .sort((left, right) => {
      if (left.missingCount !== right.missingCount) return left.missingCount - right.missingCount;
      if ((left.total ?? Number.POSITIVE_INFINITY) !== (right.total ?? Number.POSITIVE_INFINITY)) return (left.total ?? Number.POSITIVE_INFINITY) - (right.total ?? Number.POSITIVE_INFINITY);
      return left.storeName.localeCompare(right.storeName, 'sv');
    })
    .map((store, index) => ({
      ...store,
      rankLabel: `#${index + 1}`,
      totalText: store.total === null ? 'No priced basket rows' : formatBasketSek(store.total),
      coverageLabel: itemCount === 0
        ? 'Add products to compare basket coverage'
        : `${store.availableCount}/${itemCount} basket items priced`
    }));

  const bestStore = stores[0];

  return {
    requestedIds: comparison.requestedIds,
    itemCount,
    stores,
    sourceLabel: comparison.sourceLabel,
    summary: bestStore && itemCount > 0
      ? `${bestStore.storeName} currently ranks ${bestStore.rankLabel} with ${bestStore.coverageLabel}. Missing rows stay visible and substitutions point to the cheapest observed chain row.`
      : 'Add product ids to compare full basket totals across nearby stores.'
  };
}
