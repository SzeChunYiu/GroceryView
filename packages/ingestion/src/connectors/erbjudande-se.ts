export type ErbjudandeSeOffer = {
  code: string;
  name: string;
  brand: string;
  packageText: string;
  category: string;
  priceText: string;
  comparisonPrice: string;
  regularPriceText: string;
  validTo: string;
  storeName: string;
  storeId: string;
  availableInStore: boolean;
  availableOnline: boolean;
  eans: string[];
  sourceUrl: string;
  flyerUrl: string;
  flyerPdfUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type AggregatorOffer = {
  id?: unknown;
  title?: unknown;
  name?: unknown;
  brand?: unknown;
  packageText?: unknown;
  category?: unknown;
  priceText?: unknown;
  comparisonPrice?: unknown;
  regularPriceText?: unknown;
  validTo?: unknown;
  storeName?: unknown;
  storeId?: unknown;
  imageUrl?: unknown;
  flyerUrl?: unknown;
  flyerPdfUrl?: unknown;
  eans?: unknown;
};

export const ERBJUDANDE_SE_URL = 'https://www.erbjudande.se/';
export const DEFAULT_ERBJUDANDE_SE_URLS = [ERBJUDANDE_SE_URL] as const;

export type FetchErbjudandeSeOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export async function fetchErbjudandeSeOffers(
  options: FetchErbjudandeSeOffersOptions = {}
): Promise<ErbjudandeSeOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? (options.sourceUrl ? [options.sourceUrl] : DEFAULT_ERBJUDANDE_SE_URLS);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 500;
  const rows: ErbjudandeSeOffer[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Erbjudande.se request failed for ${sourceUrl}: ${response.status}`);

    rows.push(...parseErbjudandeSeOffers(await response.text(), { sourceUrl, retrievedAt, maxRows: maxRows - rows.length }));
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export function parseErbjudandeSeOffers(
  html: string,
  context: { sourceUrl: string; retrievedAt: string; maxRows?: number }
): ErbjudandeSeOffer[] {
  const offers = extractOfferArray(html);
  const rows: ErbjudandeSeOffer[] = [];
  const seen = new Set<string>();

  for (const offer of offers) {
    const row = normalizeErbjudandeSeOffer(offer, context);
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 150)) return rows;
  }

  return rows;
}

export function normalizeErbjudandeSeOffer(
  offer: AggregatorOffer,
  context: { sourceUrl: string; retrievedAt: string }
): ErbjudandeSeOffer | null {
  const code = text(offer.id);
  const name = text(offer.name) || text(offer.title);
  const priceText = text(offer.priceText);
  if (!code || !name || !priceText) return null;

  return {
    code,
    name,
    brand: text(offer.brand),
    packageText: text(offer.packageText),
    category: text(offer.category),
    priceText,
    comparisonPrice: text(offer.comparisonPrice),
    regularPriceText: text(offer.regularPriceText),
    validTo: text(offer.validTo),
    storeName: text(offer.storeName),
    storeId: text(offer.storeId),
    availableInStore: true,
    availableOnline: false,
    eans: Array.isArray(offer.eans) ? offer.eans.map(text).filter(Boolean) : [],
    sourceUrl: context.sourceUrl,
    flyerUrl: text(offer.flyerUrl) || context.sourceUrl,
    flyerPdfUrl: text(offer.flyerPdfUrl),
    imageUrl: text(offer.imageUrl),
    retrievedAt: context.retrievedAt
  };
}

function extractOfferArray(html: string): AggregatorOffer[] {
  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)?.[1];
  if (nextData) {
    const parsed = JSON.parse(nextData) as { props?: { pageProps?: { offers?: AggregatorOffer[] } } };
    if (Array.isArray(parsed.props?.pageProps?.offers)) return parsed.props.pageProps.offers;
  }

  const marker = html.match(/"offers"\s*:\s*(\[[\s\S]*?\])/);
  if (!marker) throw new Error('Erbjudande.se page did not include offers');
  return JSON.parse(marker[1]) as AggregatorOffer[];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
