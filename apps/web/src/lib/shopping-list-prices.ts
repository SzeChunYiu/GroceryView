import { axfoodProducts } from './axfood-products';

export type ShoppingListCheapestSource = {
  chainLabel: string;
  priceLabel: string;
  productSlug: string;
  spreadPercent: number;
};

export type ShoppingListPriceSource = ShoppingListCheapestSource & {
  freshness: 'live' | 'cached';
  cachedAt?: string;
};

export type OfflineShoppingListSnapshot = {
  cachedAt?: string;
  lastKnownPrices?: ShoppingListCheapestSource[];
};

export const OFFLINE_SHOPPING_LIST_CACHE_KEY = 'groceryview:shopping-list:offline-cache:v1';

const chainLabels: Record<string, string> = {
  hemkop: 'Hemköp',
  willys: 'Willys'
};

export function cheapestSourceForProductSlug(productSlug: string | null | undefined): ShoppingListCheapestSource | null {
  if (!productSlug) return null;
  const product = axfoodProducts.find((candidate) => candidate.slug === productSlug);
  if (!product || typeof product.lowestPrice !== 'number' || !Number.isFinite(product.lowestPrice)) return null;

  const lowestChain = product.lowestChain;
  const chainRow = product.chains[lowestChain as keyof typeof product.chains];
  const priceLabel = chainRow?.priceText ?? `${product.lowestPrice.toLocaleString('sv-SE', { maximumFractionDigits: 2, minimumFractionDigits: 2 })} kr`;

  return {
    chainLabel: chainLabels[lowestChain] ?? lowestChain,
    priceLabel,
    productSlug: product.slug,
    spreadPercent: product.spreadPct
  };
}

export function parseOfflineShoppingListSnapshot(value: string | null): OfflineShoppingListSnapshot | null {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as OfflineShoppingListSnapshot;
    return Array.isArray(parsed.lastKnownPrices) ? parsed : null;
  } catch {
    return null;
  }
}

export function mergeLastKnownShoppingListPrices(
  livePrices: ShoppingListCheapestSource[],
  cachedSnapshot: OfflineShoppingListSnapshot | null
) {
  const merged = new Map<string, ShoppingListCheapestSource>();

  for (const cachedPrice of cachedSnapshot?.lastKnownPrices ?? []) {
    if (cachedPrice.productSlug) merged.set(cachedPrice.productSlug, cachedPrice);
  }
  for (const livePrice of livePrices) {
    merged.set(livePrice.productSlug, livePrice);
  }

  return [...merged.values()];
}

export function cachedSourceForProductSlug(
  productSlug: string | null | undefined,
  cachedSnapshot: OfflineShoppingListSnapshot | null
): ShoppingListPriceSource | null {
  if (!productSlug) return null;
  const cachedSource = cachedSnapshot?.lastKnownPrices?.find((source) => source.productSlug === productSlug);
  if (!cachedSource) return null;

  return {
    ...cachedSource,
    cachedAt: cachedSnapshot?.cachedAt,
    freshness: 'cached'
  };
}

export function shoppingListPriceSourceForProductSlug(
  productSlug: string | null | undefined,
  cachedSnapshot: OfflineShoppingListSnapshot | null
): ShoppingListPriceSource | null {
  const liveSource = cheapestSourceForProductSlug(productSlug);
  if (liveSource) return { ...liveSource, freshness: 'live' };
  return cachedSourceForProductSlug(productSlug, cachedSnapshot);
}
