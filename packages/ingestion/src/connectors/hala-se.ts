import { overlapsWhitelistedCategory } from './overlapCategories.js';

export type HalaSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'hala';
  retailer_type: 'ethnic_polish_eastern_european';
  product_name: string;
  category: string;
  price: number;
  store_count: number;
  qualifies: true;
  source_url: string;
  retrieved_at: string;
};

export type FetchHalaSeOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const HALA_SE_BASE_URL = 'https://hala.se';
export const HALA_SE_SOURCE_URL = 'https://hala.se/';
export const HALA_SE_RETAILER_TYPE = 'ethnic_polish_eastern_european';

export async function fetchHalaSeRows(options: FetchHalaSeOptions = {}): Promise<HalaSeRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? HALA_SE_SOURCE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Hala SE request failed: ${response.status}`);
  return parseHalaSeRows(await response.text(), sourceUrl, retrievedAt).slice(0, options.maxRows ?? Number.POSITIVE_INFINITY);
}

export function parseHalaSeRows(html: string, sourceUrl = HALA_SE_SOURCE_URL, retrievedAt = new Date().toISOString()): HalaSeRow[] {
  const storeCount = verifyHalaSeStoreCount(html);
  if (storeCount === 0 || !qualifiesAsHalaEthnicPolishEasternEuropean(html)) return [];

  const rows: HalaSeRow[] = [];
  const seen = new Set<string>();
  for (const block of html.split(/<(?=article|li|section|div\b)/gi)) {
    const productName = extractProductName(block);
    const category = extractCategory(block) || productName;
    const price = extractPrice(block);
    if (!productName || price === null) continue;
    if (!overlapsWhitelistedCategory(`${productName} ${category}`)) continue;
    const key = `${productName.toLowerCase()}:${price}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'hala',
      retailer_type: HALA_SE_RETAILER_TYPE,
      product_name: productName,
      category,
      price,
      store_count: storeCount,
      qualifies: true,
      source_url: sourceUrl,
      retrieved_at: retrievedAt
    });
  }
  return rows;
}

export function verifyHalaSeStoreCount(html: string): number {
  const decoded = decodeHtml(stripHtml(html));
  const explicit = decoded.match(/(\d+)\s+(?:butiker|stores|locations|platser)/i)?.[1];
  if (explicit) return Number(explicit);
  const addressMatches = decoded.match(/\b\d{3}\s?\d{2}\s+[A-ZÅÄÖ][a-zåäö]+\b/g) ?? [];
  return new Set(addressMatches).size;
}

export function qualifiesAsHalaEthnicPolishEasternEuropean(html: string): boolean {
  const decoded = decodeHtml(stripHtml(html)).toLowerCase();
  return /hala/.test(decoded) && /(polsk|polska|polish|östeuropa|osteuropa|eastern european|ukrainsk|ukrainian|rumänsk|romanian)/i.test(decoded);
}

function extractProductName(block: string): string {
  const heading = block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1];
  const alt = block.match(/alt=["']([^"']+)["']/i)?.[1];
  const title = block.match(/title=["']([^"']+)["']/i)?.[1];
  return clean(heading ?? alt ?? title ?? '');
}

function extractCategory(block: string): string {
  const dataCategory = block.match(/data-category=["']([^"']+)["']/i)?.[1];
  const categoryClass = block.match(/class=["'][^"']*(?:category|kategori)-([^\s"']+)/i)?.[1];
  return clean(dataCategory ?? categoryClass ?? '');
}

function extractPrice(block: string): number | null {
  const match = block.match(/([0-9]+(?:[\s.]?[0-9]{3})*(?:[,.:][0-9]{1,2})?)\s*(?:kr|SEK)/i);
  return numberOrNull(match?.[1]);
}

function clean(value: string): string {
  return decodeHtml(stripHtml(value)).replace(/\s+/g, ' ').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function numberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}
