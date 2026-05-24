export const PARADISET_SE_SOURCE_URL = 'https://paradiset.se';
export const PARADISET_SE_RETAILER_ID = 'paradiset-se';

export type ParadisetSePriceRow = {
  retailerId: typeof PARADISET_SE_RETAILER_ID;
  countryCode: 'SE';
  productId: string;
  name: string;
  price: number;
  currency: string;
  sourceUrl: string;
  retrievedAt: string;
  raw: Record<string, unknown>;
};

type ProductCandidate = Record<string, unknown>;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value && typeof value === 'object' && 'value' in value) return numberValue((value as { value?: unknown }).value);
  return undefined;
}

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('retrievedAt must be a valid date.');
  return date.toISOString();
}

function productId(product: ProductCandidate): string | undefined {
  return text(product.id) ?? text(product.productId) ?? text(product.sku) ?? text(product.slug);
}

function productName(product: ProductCandidate): string | undefined {
  return text(product.name) ?? text(product.title) ?? text(product.displayName);
}

function productPrice(product: ProductCandidate): number | undefined {
  return numberValue(product.price) ?? numberValue(product.currentPrice) ?? numberValue(product.priceValue);
}

function collectProducts(payload: unknown): ProductCandidate[] {
  if (Array.isArray(payload)) return payload.flatMap(collectProducts);
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as ProductCandidate;
  if (productId(record) && productName(record) && productPrice(record) !== undefined) return [record];
  return ['products', 'items', 'results', 'data'].flatMap((key) => collectProducts(record[key]));
}

export function parseParadisetSePriceRows(payload: unknown, options: { retrievedAt?: string | Date; sourceUrl?: string } = {}): ParadisetSePriceRow[] {
  const retrievedAt = timestamp(options.retrievedAt);
  const sourceUrl = options.sourceUrl ?? PARADISET_SE_SOURCE_URL;
  return collectProducts(payload).map((product) => ({
    retailerId: PARADISET_SE_RETAILER_ID,
    countryCode: 'SE',
    productId: productId(product)!,
    name: productName(product)!,
    price: productPrice(product)!,
    currency: text(product.currency) ?? 'SEK',
    sourceUrl,
    retrievedAt,
    raw: product
  }));
}
