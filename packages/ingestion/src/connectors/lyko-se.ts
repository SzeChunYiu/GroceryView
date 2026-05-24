export const LYKO_SE_BASE_URL = 'https://www.lyko.com/sv';
export const LYKO_SE_CONNECTOR_VERSION = 'lyko-se-products-v1';

export const LYKO_SE_CATEGORY_SEEDS = [
  'hudvard',
  'harvard',
  'makeup',
  'parfym',
  'man',
  'k-beauty'
] as const;

export type LykoSeProductRow = {
  id: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'lyko';
  retailer_type: 'cosmetics';
  product_name: string;
  brand: string;
  category: string;
  price: number;
  regular_price?: number;
  in_stock: boolean;
  product_url: string;
  image_url?: string;
  captured_at: string;
  provenance: {
    source: 'lyko_se';
    parser_version: string;
    raw_record_id: string;
  };
};

type RawLykoProduct = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown) {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number.parseFloat(value.replace(',', '.').replace(/[^\d.]/g, '')) : Number.NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : undefined;
}

function bool(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return !/slut|out of stock|false/i.test(value);
  return true;
}

function productRows(payload: unknown): RawLykoProduct[] {
  if (Array.isArray(payload)) return payload.filter((row): row is RawLykoProduct => row !== null && typeof row === 'object');
  if (!payload || typeof payload !== 'object') return [];
  const object = payload as Record<string, unknown>;
  for (const key of ['products', 'items', 'results', 'hits']) {
    const value = object[key];
    if (Array.isArray(value)) return value.filter((row): row is RawLykoProduct => row !== null && typeof row === 'object');
  }
  return [];
}

function productUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/sv/')) return `https://www.lyko.com${value}`;
  return `${LYKO_SE_BASE_URL}/${value.replace(/^\/+/, '')}`;
}

export function buildLykoSeCategoryUrl(category: string, page = 1) {
  const url = new URL(`${LYKO_SE_BASE_URL}/${category}`);
  url.searchParams.set('page', String(page));
  return url.toString();
}

export function parseLykoSeProducts(
  payload: unknown,
  options: { capturedAt: string; sourceUrl?: string } = { capturedAt: new Date().toISOString() }
): LykoSeProductRow[] {
  return productRows(payload).flatMap((row) => {
    const id = text(row.id ?? row.sku ?? row.articleNumber ?? row.productId);
    const productName = text(row.product_name ?? row.productName ?? row.name ?? row.title);
    const brand = text(row.brand ?? row.brandName ?? row.manufacturer);
    const category = text(row.category ?? row.categoryName ?? row.mainCategory) || 'cosmetics';
    const parsedPrice = number(row.price ?? row.salesPrice ?? row.currentPrice);
    if (!id || !productName || parsedPrice === undefined) return [];

    const href = text(row.product_url ?? row.productUrl ?? row.url ?? row.slug) || id;
    const regularPrice = number(row.regular_price ?? row.regularPrice ?? row.originalPrice);

    return [{
      id,
      country: 'SE' as const,
      currency: 'SEK' as const,
      chain: 'lyko' as const,
      retailer_type: 'cosmetics' as const,
      product_name: productName,
      brand: brand || 'Lyko assortment',
      category,
      price: parsedPrice,
      ...(regularPrice !== undefined ? { regular_price: regularPrice } : {}),
      in_stock: bool(row.in_stock ?? row.inStock ?? row.stockStatus),
      product_url: productUrl(href),
      ...(text(row.image_url ?? row.imageUrl ?? row.image) ? { image_url: text(row.image_url ?? row.imageUrl ?? row.image) } : {}),
      captured_at: options.capturedAt,
      provenance: {
        source: 'lyko_se' as const,
        parser_version: LYKO_SE_CONNECTOR_VERSION,
        raw_record_id: id
      }
    }];
  });
}

export async function fetchLykoSeProducts(options: {
  fetchImpl?: typeof fetch;
  categories?: readonly string[];
  capturedAt?: string;
} = {}): Promise<LykoSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const categories = options.categories ?? LYKO_SE_CATEGORY_SEEDS;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const rows: LykoSeProductRow[] = [];

  for (const category of categories) {
    const sourceUrl = buildLykoSeCategoryUrl(category);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'application/json,text/html',
        'user-agent': 'GroceryView/0.1 Lyko SE connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 429) {
      throw new Error(`Lyko SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) continue;
    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('json') ? await response.json() : [];
    rows.push(...parseLykoSeProducts(payload, { capturedAt, sourceUrl }));
  }

  return rows;
}
