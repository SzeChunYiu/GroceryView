import { isOverlapCategory, type OverlapCategory } from './overlapCategories.js';

export type PongMarketProductRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'pong-market';
  retailer_type: 'ethnic_asian';
  storeCount: number;
  sku: string;
  name: string;
  brand?: string;
  category: OverlapCategory;
  price: number;
  sourceUrl: string;
};

export const PONG_MARKET_SE_URL = 'https://pongmarket.se/';
export const pongMarketPhysicalStores = [
  { city: 'Stockholm', name: 'Pong Market Stockholm' },
  { city: 'Gothenburg', name: 'Pong Market Göteborg' },
  { city: 'Malmö', name: 'Pong Market Malmö' }
] as const;

type RawPongProduct = {
  sku?: unknown;
  name?: unknown;
  brand?: unknown;
  category?: unknown;
  price?: unknown;
};

export function parsePongMarketProducts(payload: unknown, sourceUrl = PONG_MARKET_SE_URL): PongMarketProductRow[] {
  const products = Array.isArray(payload) ? payload : [];
  if (pongMarketPhysicalStores.length < 3) throw new Error('Pong Market inclusion requires at least 3 physical stores.');

  return products
    .map((product) => normalizePongMarketProduct(product as RawPongProduct, sourceUrl))
    .filter((row): row is PongMarketProductRow => row !== null);
}

export function normalizePongMarketProduct(product: RawPongProduct, sourceUrl = PONG_MARKET_SE_URL): PongMarketProductRow | null {
  const sku = text(product.sku);
  const name = text(product.name);
  const category = text(product.category);
  const price = number(product.price);
  if (!sku || !name || price === null || !isOverlapCategory(category)) return null;

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'pong-market',
    retailer_type: 'ethnic_asian',
    storeCount: pongMarketPhysicalStores.length,
    sku,
    name,
    brand: text(product.brand) || undefined,
    category,
    price,
    sourceUrl
  };
}

export function pongMarketFixtureRows() {
  return parsePongMarketProducts([
    { sku: 'deemae-100', name: 'Demae Ramen Noodles', brand: 'Nissin', category: 'noodles', price: 8.9 },
    { sku: 'soy-500', name: 'Japansk soja 500 ml', brand: 'Kikkoman', category: 'soy-sauce', price: 39.9 },
    { sku: 'rice-5kg', name: 'Jasminris 5 kg', brand: 'Royal Umbrella', category: 'rice', price: 149 }
  ]);
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}
