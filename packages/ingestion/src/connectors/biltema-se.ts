export type BiltemaSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'biltema-se';
  retailerType: 'household';
  code: string;
  name: string;
  category: string;
  price: number;
  priceText: string;
  previousPrice: number | null;
  previousPriceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchBiltemaSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const BILTEMA_SE_BASE_URL = 'https://www.biltema.se';
export const BILTEMA_SE_DEFAULT_SOURCE_URLS = [
  `${BILTEMA_SE_BASE_URL}/hem/`,
  `${BILTEMA_SE_BASE_URL}/kontor---teknik/batterier/`,
  `${BILTEMA_SE_BASE_URL}/fritid/`
] as const;

export async function fetchBiltemaSeProducts(options: FetchBiltemaSeProductsOptions = {}): Promise<BiltemaSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: BiltemaSeProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? BILTEMA_SE_DEFAULT_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 biltema-se-connector'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Biltema SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Biltema SE request failed for ${sourceUrl}: ${response.status}`);

    const remainingRows = options.maxRows ? options.maxRows - rows.length : undefined;
    for (const row of parseBiltemaSeProducts(await response.text(), sourceUrl, retrievedAt, remainingRows)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) break;
    }
    if (options.maxRows && rows.length >= options.maxRows) break;
  }

  if (rows.length === 0) throw new Error('Biltema SE connector found no parseable household rows.');
  return rows;
}

export function parseBiltemaSeProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): BiltemaSeProduct[] {
  if (!sourceUrl.includes('biltema.se')) throw new Error('Biltema SE connector only accepts biltema.se source URLs');
  if (/captcha|access denied|cloudflare|logga in/i.test(html)) throw new Error('Biltema SE source blocked/login page');

  const rows: BiltemaSeProduct[] = [];
  const seen = new Set<string>();
  for (const item of extractArticleListingItems(html)) {
    const row = normalizeBiltemaSeProduct(item, sourceUrl, retrievedAt);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (maxRows && rows.length >= maxRows) break;
  }
  return rows;
}

function normalizeBiltemaSeProduct(item: unknown, sourceUrl: string, retrievedAt: string): BiltemaSeProduct | null {
  if (!isRecord(item)) return null;
  const code = text(item.articleNumber) || text(item.productId) || text(item.url);
  const name = text(item.name);
  const price = numberFromBiltemaPrice(item.priceIncVAT);
  if (!code || !name || price === null) return null;

  const analytics = isRecord(item.analyticsProductEntity) ? item.analyticsProductEntity : null;
  const categoryHierarchy = text(analytics?.categoryHierarchy);
  const categories = Array.isArray(analytics?.categories) ? analytics.categories.map(text).filter(Boolean) : [];
  const previousPrice = numberFromBiltemaPrice(item.previousPrice);

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'biltema-se',
    retailerType: 'household',
    code,
    name,
    category: categoryHierarchy || categories.join('/') || 'Hem',
    price,
    priceText: priceText(price),
    previousPrice,
    previousPriceText: previousPrice && previousPrice > 0 ? priceText(previousPrice) : '',
    productUrl: absoluteUrl(text(item.url), sourceUrl),
    imageUrl: absoluteUrl(text(item.imageUrl) || text(item.imageUrlMedium) || text(item.imageUrlSmall), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

function extractArticleListingItems(html: string): unknown[] {
  const items: unknown[] = [];
  const marker = 'window.articleListing_';
  let searchFrom = 0;
  while (true) {
    const markerIndex = html.indexOf(marker, searchFrom);
    if (markerIndex === -1) return items;
    const arrayStart = html.indexOf('[', markerIndex);
    const arrayEnd = findMatchingBracket(html, arrayStart);
    if (arrayStart !== -1 && arrayEnd !== -1) {
      try {
        const parsed = JSON.parse(html.slice(arrayStart, arrayEnd + 1).replace(/\bundefined\b/g, 'null')) as unknown;
        if (Array.isArray(parsed)) items.push(...parsed);
      } catch {
        // Ignore malformed inline listings and continue looking for other listing payloads.
      }
      searchFrom = arrayEnd + 1;
    } else {
      searchFrom = markerIndex + marker.length;
    }
  }
}

function numberFromBiltemaPrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const raw = text(value).replace(/\s/g, '').replace(',', '.');
  if (!raw) return null;
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

function priceText(value: number): string {
  return `${value.toLocaleString('sv-SE', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} kr`;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return '';
  }
}

function findMatchingBracket(value: string, start: number): number {
  if (start < 0) return -1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
    } else if (char === '"') {
      inString = true;
    } else if (char === '[') {
      depth += 1;
    } else if (char === ']') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
