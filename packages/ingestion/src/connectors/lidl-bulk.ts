import {
  DEFAULT_LIDL_OFFER_PATHS,
  LIDL_BASE_URL,
  fetchLidlOffers,
  type LidlOffer,
} from './lidl.js';

export const LIDL_BULK_OFFER_INDEX_PATH = '/c/';
export const LIDL_BULK_MINIMUM_ROWS = 50;
export const DEFAULT_LIDL_BULK_MAX_ROWS = 500;

export const DEFAULT_LIDL_BULK_OFFER_PATHS = [
  ...DEFAULT_LIDL_OFFER_PATHS
] as const;

export type FetchLidlBulkProductsOptions = {
  fetchImpl?: typeof fetch;
  offerPaths?: readonly string[];
  maxRows?: number;
  minRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export function buildLidlBulkOfferCatalogUrl(baseUrl = LIDL_BASE_URL): string {
  return new URL(LIDL_BULK_OFFER_INDEX_PATH, baseUrl).toString();
}

export function extractLidlBulkOfferPaths(html: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/href=(["'])(.*?)\1/g)) {
    const raw = decodeHtmlEntities(match[2]);
    const path = toPath(raw);
    if (!path.startsWith('/c/') || !/\/a\d+\/?$/.test(path)) continue;
    const canonical = path.replace(/#.*$/, '').split('?')[0];
    if (!canonical.startsWith('/c/')) continue;
    if (canonical.includes('/assets/')) continue;
    if (seen.has(canonical)) continue;
    seen.add(canonical);
    paths.push(canonical);
  }
  return paths;
}

export async function fetchLidlBulkProducts(options: FetchLidlBulkProductsOptions = {}): Promise<LidlOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = options.baseUrl;
  const offerPaths = options.offerPaths?.length ? options.offerPaths : await discoverLidlBulkOfferPaths({
    fetchImpl,
    baseUrl
  });
  const rows = await fetchLidlOffers({
    fetchImpl,
    offerPaths: offerPaths.length ? offerPaths : DEFAULT_LIDL_BULK_OFFER_PATHS,
    maxRows: options.maxRows ?? DEFAULT_LIDL_BULK_MAX_ROWS,
    retrievedAt: options.retrievedAt,
    baseUrl
  });
  const minimumRows = options.minRows ?? LIDL_BULK_MINIMUM_ROWS;

  if (rows.length < minimumRows) {
    throw new Error(`Lidl bulk fetch returned only ${rows.length} rows; minimum required is ${minimumRows}.`);
  }

  return rows;
}

async function discoverLidlBulkOfferPaths(params: { fetchImpl?: typeof fetch; baseUrl?: string; }): Promise<string[]> {
  const { fetchImpl = fetch, baseUrl } = params;
  const response = await fetchImpl(buildLidlBulkOfferCatalogUrl(baseUrl), {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) {
    return [...DEFAULT_LIDL_BULK_OFFER_PATHS];
  }

  const paths = extractLidlBulkOfferPaths(await response.text());
  if (paths.length === 0) {
    return [...DEFAULT_LIDL_BULK_OFFER_PATHS];
  }

  return paths;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&apos;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function toPath(raw: string): string {
  if (raw.startsWith('http')) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw;
}
