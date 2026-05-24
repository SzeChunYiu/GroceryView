export const REMA_1000_NO_PRODUCTS_URL = 'https://www.rema.no/api/products';

export type Rema1000NoProductRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'rema-1000-no';
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  unitPrice: number | null;
  unit: string;
  sourceUrl: string;
  retrievedAt: string;
};

type RemaPayload = { products?: unknown; items?: unknown };

export type FetchRema1000NoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export async function fetchRema1000NoProducts(options: FetchRema1000NoProductsOptions = {}): Promise<Rema1000NoProductRow[]> {
  const sourceUrl = options.sourceUrl ?? REMA_1000_NO_PRODUCTS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 Rema 1000 Norway connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Rema 1000 Norway request failed: ${response.status}`);
  return parseRema1000NoProducts(await response.json() as RemaPayload, sourceUrl, options.retrievedAt ?? new Date().toISOString());
}

export function parseRema1000NoProducts(payload: RemaPayload, sourceUrl: string, retrievedAt: string): Rema1000NoProductRow[] {
  const rows = arrayOfRecords(payload.products).length > 0 ? arrayOfRecords(payload.products) : arrayOfRecords(payload.items);
  return rows.map((row) => normalizeRema1000NoProduct(row, sourceUrl, retrievedAt)).filter((row): row is Rema1000NoProductRow => row !== null);
}

export function normalizeRema1000NoProduct(row: Record<string, unknown>, sourceUrl: string, retrievedAt: string): Rema1000NoProductRow | null {
  const code = text(row.id) || text(row.code) || text(row.ean);
  const name = text(row.name) || text(row.title);
  const price = numberOrNull(row.price) ?? numberOrNull((row.priceInfo as { price?: unknown } | undefined)?.price);
  if (!code || !name || price === null || price < 0) return null;
  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'rema-1000-no',
    code,
    name,
    brand: text(row.brand),
    category: text(row.category),
    price,
    unitPrice: numberOrNull(row.unitPrice),
    unit: text(row.unit),
    sourceUrl,
    retrievedAt
  };
}

function arrayOfRecords(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null && !Array.isArray(item)) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.replace(',', '.')) : NaN;
  return Number.isFinite(numeric) ? numeric : null;
}
