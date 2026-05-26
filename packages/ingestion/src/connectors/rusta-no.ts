export type RustaNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'rusta-no';
  retailerType: 'variety_discount';
  code: string;
  name: string;
  brand: string;
  category: string;
  subtitle: string;
  price: number;
  priceText: string;
  originalPrice: number | null;
  memberPrice: number | null;
  comparisonPrice: number | null;
  comparisonUnit: string;
  onSale: boolean;
  memberOffer: boolean;
  buyableOnline: boolean;
  buyableInStore: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchRustaNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const RUSTA_NO_BASE_URL = 'https://www.rusta.com';
export const RUSTA_NO_DEFAULT_SOURCE_URLS = [
  `${RUSTA_NO_BASE_URL}/nb-no/kjokken-og-husholdning`,
  `${RUSTA_NO_BASE_URL}/nb-no/fritid-og-reise/mat-og-drikke`,
  `${RUSTA_NO_BASE_URL}/nb-no/kjokken-og-husholdning/rengjoringsutstyr`
] as const;
export const RUSTA_NO_PARSER_VERSION = 'rusta-no-current-page-v1';

export async function fetchRustaNoProducts(options: FetchRustaNoProductsOptions = {}): Promise<RustaNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: RustaNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? RUSTA_NO_DEFAULT_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/json',
        'user-agent': 'GroceryView/0.1 rusta-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Rusta NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Rusta NO source failed for ${sourceUrl}: HTTP ${response.status}.`);

    for (const product of parseRustaNoProducts(await response.text(), sourceUrl, retrievedAt)) {
      if (seen.has(product.code)) continue;
      seen.add(product.code);
      rows.push(product);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseRustaNoProducts(payload: unknown, sourceUrl: string, retrievedAt: string): RustaNoProduct[] {
  if (!sourceUrl.includes('rusta.com')) throw new Error('Rusta NO connector only accepts rusta.com source URLs');
  const page = typeof payload === 'string' ? extractCurrentPage(payload) : payload;
  return collectRustaNoCandidates(page)
    .map((candidate) => normalizeRustaNoProduct(candidate, sourceUrl, retrievedAt))
    .filter((product): product is RustaNoProduct => product !== null);
}

export function normalizeRustaNoProduct(candidate: unknown, sourceUrl: string, retrievedAt: string): RustaNoProduct | null {
  if (!isRecord(candidate)) return null;
  const code = firstText(candidate, ['code', 'variationCode']) || firstText(recordAt(candidate, ['recommendationLists', 'context']), ['productCode']);
  const name = firstText(candidate, ['displayName', 'name', 'title']);
  const price = money(recordAt(candidate, ['price', 'current'])?.inclVat ?? candidate.price);
  if (!code || !name || price === null) return null;

  const priceRecord = recordAt(candidate, ['price']);
  const originalPrice = money(recordAt(priceRecord, ['original'])?.inclVat);
  const memberPrice = money(recordAt(priceRecord, ['memberCurrent'])?.inclVat);
  const comparisonPrice = money(priceRecord?.comparisonPrice);
  const productPath = firstText(candidate, ['url', 'canonicalUrl']);
  const brand = firstText(recordAt(candidate, ['rateAndReviewsScore']), ['brand']);
  const imagePath = firstImage(candidate);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'rusta-no',
    retailerType: 'variety_discount',
    code,
    name,
    brand,
    category: firstText(candidate, ['category']),
    subtitle: firstText(candidate, ['subTitle', 'subtitle']),
    price,
    priceText: `${formatNorwegianMoney(price)} kr`,
    originalPrice,
    memberPrice,
    comparisonPrice,
    comparisonUnit: text(priceRecord?.comparisonUnit),
    onSale: candidate.isSale === true || (originalPrice !== null && originalPrice > price),
    memberOffer: candidate.memberPrice === true || memberPrice !== null,
    buyableOnline: candidate.buyableOnline === true,
    buyableInStore: candidate.buyableInStore === true,
    productUrl: productPath ? absoluteUrl(productPath, sourceUrl) : sourceUrl,
    imageUrl: imagePath ? absoluteUrl(imagePath, sourceUrl) : '',
    sourceUrl,
    retrievedAt
  };
}

function extractCurrentPage(html: string): unknown {
  const match = html.match(/window\.CURRENT_PAGE\s*=\s*({[\s\S]*?});\s*(?:\r?\n|<\/script>)/i);
  if (!match?.[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function collectRustaNoCandidates(payload: unknown): unknown[] {
  const candidates: unknown[] = [];
  const seenObjects = new Set<object>();
  const seenCandidates = new Set<object>();

  const addCandidate = (value: unknown): void => {
    if (!looksLikeProduct(value) || seenCandidates.has(value)) return;
    seenCandidates.add(value);
    candidates.push(value);
  };

  const visit = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) addCandidate(item);
      for (const item of value) visit(item);
      return;
    }
    if (!isRecord(value) || seenObjects.has(value)) return;
    seenObjects.add(value);
    const products = value.products;
    if (Array.isArray(products)) {
      for (const product of products) addCandidate(product);
    }
    for (const child of Object.values(value)) visit(child);
  };

  visit(payload);
  return candidates;
}

function looksLikeProduct(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return Boolean(firstText(value, ['displayName', 'name', 'title'])) && money(recordAt(value, ['price', 'current'])?.inclVat ?? value.price) !== null;
}

function firstImage(candidate: Record<string, unknown>): string {
  const images = candidate.images;
  if (!Array.isArray(images)) return '';
  for (const image of images) {
    const url = firstText(image, ['url', 'src']);
    if (url) return url;
  }
  return '';
}

function recordAt(value: unknown, path: string[]): Record<string, unknown> | null {
  let current: unknown = value;
  for (const key of path) {
    if (!isRecord(current)) return null;
    current = current[key];
  }
  return isRecord(current) ? current : null;
}

function firstText(record: unknown, keys: string[]): string {
  if (!isRecord(record)) return '';
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return '';
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function money(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return Math.round((value + Number.EPSILON) * 100) / 100;
  const normalized = text(value).replace(/\s/g, '').replace(/kr|nok|,-/gi, '').replace(',', '.');
  if (!normalized) return null;
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function formatNorwegianMoney(value: number): string {
  return value.toLocaleString('nb-NO', { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 });
}

function absoluteUrl(value: string, sourceUrl: string): string {
  return new URL(value, sourceUrl).toString();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
