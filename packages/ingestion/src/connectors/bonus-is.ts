export type BonusIsRow = {
  brand: string;
  category: string;
  currency: 'ISK';
  name: string;
  price: number;
  productId: string;
  sourceUrl: string;
  url: string;
};

type BonusIsApiProduct = {
  brand?: unknown;
  category?: unknown;
  id?: unknown;
  name?: unknown;
  price?: unknown;
  url?: unknown;
};

export const BONUS_IS_OFFERS_URL = 'https://bonus.is/api/products';

export async function fetchBonusIsRows(fetchImpl: typeof fetch = fetch, sourceUrl = BONUS_IS_OFFERS_URL): Promise<BonusIsRow[]> {
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Bonus IS request failed: ${response.status}`);
  return parseBonusIsRows(await response.json(), sourceUrl);
}

export function parseBonusIsRows(payload: unknown, sourceUrl = BONUS_IS_OFFERS_URL): BonusIsRow[] {
  const products = Array.isArray(payload) ? payload : Array.isArray((payload as { products?: unknown }).products) ? (payload as { products: unknown[] }).products : [];
  return products.map((product) => normalizeBonusIsProduct(product as BonusIsApiProduct, sourceUrl)).filter((row): row is BonusIsRow => Boolean(row));
}

export function normalizeBonusIsProduct(product: BonusIsApiProduct, sourceUrl = BONUS_IS_OFFERS_URL): BonusIsRow | null {
  const name = text(product.name);
  const productId = text(product.id);
  const price = priceNumber(product.price);
  if (!name || !productId || price === null) return null;
  return {
    brand: text(product.brand),
    category: text(product.category) || 'bonus-is',
    currency: 'ISK',
    name,
    price,
    productId,
    sourceUrl,
    url: new URL(text(product.url) || `/vara/${productId}`, sourceUrl).toString()
  };
}

function priceNumber(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(/\./g, '').replace(',', '.')) : Number.NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
