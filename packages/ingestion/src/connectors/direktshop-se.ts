export type DirektshopSeOffer = {
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
  sourceUrl: string;
  flyerUrl: string;
  flyerPdfUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type DirektshopOfferCandidate = {
  brand?: unknown;
  category?: unknown;
  comparisonPrice?: unknown;
  gtin?: unknown;
  id?: unknown;
  image?: unknown;
  name?: unknown;
  packageText?: unknown;
  price?: unknown;
  priceText?: unknown;
  regularPrice?: unknown;
  sku?: unknown;
  storeId?: unknown;
  storeName?: unknown;
  title?: unknown;
  url?: unknown;
  validTo?: unknown;
};

export const DIREKTSHOP_SE_BASE_URL = 'https://www.direkten.se';
export const DIREKTSHOP_EMAGIN_PDF_API_BASE_URL = 'https://api.e-magin.se/api/pdf/';
export const DEFAULT_DIREKTSHOP_SE_OFFER_PAGE_URLS = [
  'https://www.direkten.se/erbjudanden',
  'https://www.direkten.se/kampanjer'
] as const;

export type FetchDirektshopSeOffersOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
  sourceUrls?: readonly string[];
};

export async function fetchDirektshopSeOffers(
  options: FetchDirektshopSeOffersOptions = {}
): Promise<DirektshopSeOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = options.sourceUrls ?? (options.sourceUrl ? [options.sourceUrl] : DEFAULT_DIREKTSHOP_SE_OFFER_PAGE_URLS);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const maxRows = options.maxRows ?? 500;
  const rows: DirektshopSeOffer[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`Direktshop offer page request failed for ${sourceUrl}: ${response.status}`);
    }

    rows.push(...parseDirektshopSeOffers(await response.text(), {
      maxRows: maxRows - rows.length,
      retrievedAt,
      sourceUrl
    }));
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export function parseDirektshopSeOffers(
  html: string,
  context: {
    maxRows?: number;
    retrievedAt: string;
    sourceUrl: string;
  }
): DirektshopSeOffer[] {
  const flyerUrl = extractDirektshopFlyerUrl(html, context.sourceUrl);
  const flyerPdfUrl = buildDirektshopPdfUrl(flyerUrl);
  const rows: DirektshopSeOffer[] = [];
  const seenCodes = new Set<string>();

  for (const offer of parseDirektshopOfferCandidates(html)) {
    const row = normalizeDirektshopSeOffer(offer, {
      flyerPdfUrl,
      flyerUrl,
      retrievedAt: context.retrievedAt,
      sourceUrl: context.sourceUrl
    });
    if (!row || seenCodes.has(row.code)) continue;

    seenCodes.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? 100)) return rows;
  }

  return rows;
}

export function extractDirektshopFlyerUrl(html: string, sourceUrl: string): string {
  const emaginMatch = html.match(/https?:\\?\/\\?\/[^"']*e-magin\.se[^"']+/i);
  const pdfMatch = html.match(/https?:\\?\/\\?\/[^"']+\.pdf/i);
  return decodeLooseUrl(emaginMatch?.[0] ?? pdfMatch?.[0] ?? sourceUrl);
}

export function buildDirektshopPdfUrl(flyerUrl: string): string {
  const paperKey = flyerUrl.match(/\/latestpaper\/([^/?#]+)/)?.[1] ?? flyerUrl.match(/\/paper\/([^/?#]+)/)?.[1] ?? '';
  return paperKey ? new URL(encodeURIComponent(paperKey), DIREKTSHOP_EMAGIN_PDF_API_BASE_URL).toString() : flyerUrl;
}

export function normalizeDirektshopSeOffer(
  offer: DirektshopOfferCandidate,
  context: {
    flyerPdfUrl: string;
    flyerUrl: string;
    retrievedAt: string;
    sourceUrl: string;
  }
): DirektshopSeOffer | null {
  const name = text(offer.name ?? offer.title);
  const priceText = text(offer.priceText) || formatPrice(offer.price);
  if (!name || !priceText) return null;

  const code = text(offer.id ?? offer.sku ?? offer.gtin) || slugify(name);
  return {
    code,
    name,
    brand: brandText(offer.brand),
    packageText: text(offer.packageText),
    category: categoryText(offer.category),
    priceText,
    comparisonPrice: text(offer.comparisonPrice),
    regularPriceText: formatRegularPrice(offer.regularPrice),
    validTo: text(offer.validTo),
    storeName: text(offer.storeName) || 'Direkten',
    storeId: text(offer.storeId) || 'direkten-se',
    sourceUrl: context.sourceUrl,
    flyerUrl: context.flyerUrl,
    flyerPdfUrl: context.flyerPdfUrl,
    imageUrl: absoluteUrl(offer.image ?? offer.url, DIREKTSHOP_SE_BASE_URL),
    retrievedAt: context.retrievedAt
  };
}

function parseDirektshopOfferCandidates(html: string): DirektshopOfferCandidate[] {
  const candidates: DirektshopOfferCandidate[] = [];
  for (const data of extractJsonBlocks(html)) {
    visit(data, (value) => {
      const candidate = value as DirektshopOfferCandidate;
      if ((candidate.name || candidate.title) && (candidate.price || candidate.priceText)) {
        candidates.push(candidate);
      }
    });
  }

  return candidates;
}

function extractJsonBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    const jsonText = match[1];
    if (!jsonText) continue;

    try {
      blocks.push(JSON.parse(jsonText));
    } catch {
      // Ignore unrelated JSON blocks.
    }
  }

  const nextData = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (nextData?.[1]) {
    try {
      blocks.push(JSON.parse(nextData[1]));
    } catch {
      // Ignore if hydration data changes.
    }
  }

  return blocks;
}

function formatPrice(value: unknown): string {
  const price = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(price) ? `${price.toFixed(2)} kr` : '';
}

function formatRegularPrice(value: unknown): string {
  const regularPrice = text(value);
  return regularPrice ? `Ord.pris ${regularPrice}` : '';
}

function categoryText(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value) {
    return text((value as { name?: unknown }).name);
  }

  return text(value);
}

function brandText(value: unknown): string {
  if (value && typeof value === 'object' && 'name' in value) {
    return text((value as { name?: unknown }).name);
  }

  return text(value);
}

function absoluteUrl(value: unknown, baseUrl: string): string {
  const raw = text(value);
  if (!raw || raw.startsWith('data:')) return '';

  return new URL(raw, baseUrl).toString();
}

function decodeLooseUrl(value: string): string {
  return value.replace(/\\\//g, '/').replace(/&amp;/g, '&');
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9åäö]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function visit(value: unknown, visitor: (value: unknown) => void): void {
  visitor(value);
  if (Array.isArray(value)) {
    for (const item of value) visit(item, visitor);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) visit(item, visitor);
  }
}
