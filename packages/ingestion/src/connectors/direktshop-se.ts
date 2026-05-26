export type DirektshopSeStructuredPromotion =
  | {
      kind: 'multi_buy';
      quantity: number;
      price: number;
      sourceText: string;
    }
  | {
      kind: 'percent_off';
      percentOff: number;
      sourceText: string;
    };

export type DirektshopSeFlyerOffer = {
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
  sourceUrl: string;
  flyerUrl: string;
  flyerPdfUrl: string;
  imageUrl: string;
  retrievedAt: string;
  structuredPromotion: DirektshopSeStructuredPromotion | null;
};

type DirektshopWeeklyOffer = {
  id?: unknown;
  details?: {
    brand?: unknown;
    packageInformation?: unknown;
    name?: unknown;
    mechanicInfo?: unknown;
  };
  category?: {
    articleGroupName?: unknown;
  };
  validTo?: unknown;
  comparisonPrice?: unknown;
  stores?: Array<{
    storeMarketingName?: unknown;
    storeId?: unknown;
    regularPrice?: unknown;
    referencePriceText?: unknown;
    storeInd?: unknown;
  }>;
  eans?: Array<{
    id?: unknown;
    image?: unknown;
  }>;
};

export type FetchDirektshopSeFlyerOffersOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const DIREKTSHOP_SE_DEFAULT_SOURCE_URLS = [
  'https://direkten.se/kampanjer/',
  'https://direktenkampanj.se/'
] as const;
export const DIREKTSHOP_SE_DEFAULT_MAX_ROWS = 500;
export const DIREKTSHOP_SE_EMAGIN_PDF_API_BASE_URL = 'https://api.e-magin.se/api/pdf/';

export async function fetchDirektshopSeFlyerOffers(
  options: FetchDirektshopSeFlyerOffersOptions = {}
): Promise<DirektshopSeFlyerOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? DIREKTSHOP_SE_DEFAULT_SOURCE_URLS;
  const maxRows = options.maxRows ?? DIREKTSHOP_SE_DEFAULT_MAX_ROWS;
  const rows: DirektshopSeFlyerOffer[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 direktshop-se-flyer-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Direktshop SE flyer page request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseDirektshopSeFlyerOffers(await response.text(), {
      sourceUrl,
      retrievedAt,
      maxRows: maxRows - rows.length
    }));
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export function parseDirektshopSeFlyerOffers(
  html: string,
  context: {
    sourceUrl: string;
    retrievedAt: string;
    maxRows?: number;
  }
): DirektshopSeFlyerOffer[] {
  assertDirektshopSource(context.sourceUrl);
  if (/captcha|access denied|cloudflare|logga in/i.test(html)) throw new Error('Direktshop SE flyer source returned a blocked/login page.');

  const flyerUrl = extractDirektshopSeFlyerUrl(html, context.sourceUrl);
  const flyerPdfUrl = buildDirektshopSeEmaginPdfUrl(flyerUrl);
  const rows: DirektshopSeFlyerOffer[] = [];
  const seenCodes = new Set<string>();

  for (const offer of parseWeeklyOffers(html)) {
    const row = normalizeDirektshopSeFlyerOffer(offer, {
      sourceUrl: context.sourceUrl,
      flyerUrl,
      flyerPdfUrl,
      retrievedAt: context.retrievedAt
    });
    if (!row || seenCodes.has(row.code)) continue;
    seenCodes.add(row.code);
    rows.push(row);
    if (rows.length >= (context.maxRows ?? DIREKTSHOP_SE_DEFAULT_MAX_ROWS)) return rows;
  }

  return rows;
}

export function extractDirektshopSeFlyerUrl(html: string, sourceUrl: string): string {
  const drblad = html.match(/"text":"DRBlad","type":"DRBlad","url":"([^"]+)"/);
  if (drblad?.[1]) return decodeJsonString(drblad[1]);
  const emagin = html.match(/https?:\/\/(?:www\.)?e-magin\.se\/(?:latestpaper|paper)\/[^"'<\s]+/i);
  if (emagin?.[0]) return emagin[0];
  const href = html.match(/href=["']([^"']*(?:e-magin|reklamblad|kampanjblad)[^"']*)["']/i);
  return href?.[1] ? new URL(decodeHtml(href[1]), sourceUrl).toString() : '';
}

export function buildDirektshopSeEmaginPdfUrl(flyerUrl: string): string {
  const paperKey = flyerUrl.match(/\/latestpaper\/([^/?#]+)/)?.[1] ?? flyerUrl.match(/\/paper\/([^/?#]+)/)?.[1] ?? '';
  return paperKey ? new URL(encodeURIComponent(paperKey), DIREKTSHOP_SE_EMAGIN_PDF_API_BASE_URL).toString() : '';
}

export function normalizeDirektshopSeFlyerOffer(
  offer: DirektshopWeeklyOffer,
  context: {
    sourceUrl: string;
    flyerUrl: string;
    flyerPdfUrl: string;
    retrievedAt: string;
  }
): DirektshopSeFlyerOffer | null {
  const code = text(offer.id);
  const name = text(offer.details?.name);
  const priceText = text(offer.details?.mechanicInfo);
  if (!code || !name || !priceText) return null;

  const store = offer.stores?.[0];
  return {
    code,
    name,
    brand: text(offer.details?.brand),
    packageText: text(offer.details?.packageInformation),
    category: text(offer.category?.articleGroupName),
    priceText,
    comparisonPrice: text(offer.comparisonPrice),
    regularPriceText: text(store?.referencePriceText) || formatRegularPrice(store?.regularPrice),
    validTo: text(offer.validTo),
    storeName: text(store?.storeMarketingName),
    storeId: text(store?.storeId),
    availableInStore: store?.storeInd === true,
    sourceUrl: context.sourceUrl,
    flyerUrl: context.flyerUrl,
    flyerPdfUrl: context.flyerPdfUrl,
    imageUrl: text(offer.eans?.[0]?.image),
    retrievedAt: context.retrievedAt,
    structuredPromotion: parseDirektshopSeStructuredPromotion(priceText)
  };
}

export function parseDirektshopSeStructuredPromotion(priceText: string): DirektshopSeStructuredPromotion | null {
  const sourceText = priceText.trim();
  const multiBuy = sourceText.match(/(\d+)\s*(?:för|for)\s*(\d+(?:[,.]\d+)?)/i);
  if (multiBuy) {
    return {
      kind: 'multi_buy',
      quantity: Number.parseInt(multiBuy[1] ?? '', 10),
      price: parseSwedishNumber(multiBuy[2]),
      sourceText
    };
  }

  const percentOff = sourceText.match(/(\d+(?:[,.]\d+)?)\s*%\s*(?:rabatt|off)?/i);
  if (percentOff) {
    return {
      kind: 'percent_off',
      percentOff: parseSwedishNumber(percentOff[1]),
      sourceText
    };
  }

  return null;
}

function parseWeeklyOffers(html: string): DirektshopWeeklyOffer[] {
  const markerIndex = html.search(/"weeklyOffers"\s*:/);
  if (markerIndex < 0) throw new Error('Direktshop flyer page did not include weeklyOffers');
  const arrayStart = html.indexOf('[', markerIndex);
  const arrayEnd = findMatchingBracket(html, arrayStart);
  if (arrayStart < 0 || arrayEnd < 0) throw new Error('Direktshop weeklyOffers array was malformed');
  return JSON.parse(html.slice(arrayStart, arrayEnd).replace(/\bundefined\b/g, 'null')) as DirektshopWeeklyOffer[];
}

function findMatchingBracket(textValue: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < textValue.length; index += 1) {
    const char = textValue[index];
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
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function assertDirektshopSource(sourceUrl: string): void {
  const hostname = new URL(sourceUrl).hostname;
  if (!['direkten.se', 'www.direkten.se', 'direktenkampanj.se', 'www.direktenkampanj.se'].includes(hostname)) {
    throw new Error('Direktshop SE connector only accepts Direkten campaign source URLs.');
  }
}

function parseSwedishNumber(value: string | undefined): number {
  return Number.parseFloat((value ?? '0').replace(',', '.'));
}

function formatRegularPrice(value: unknown): string {
  const regularPrice = text(value);
  return regularPrice ? `Ord.pris ${regularPrice} kr.` : '';
}

function decodeJsonString(value: string): string {
  return JSON.parse(`"${value}"`) as string;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
