export type CityGrossStructuredPromotion =
  | { kind: 'percent_off'; pct: number }
  | { kind: 'bulk_price'; quantity: number; price: number }
  | { kind: 'fixed_price'; price: number }
  | { kind: 'family_size'; text: string }
  | { kind: 'unknown'; text: string };

export type CityGrossFlyerOffer = {
  code: string;
  name: string;
  brand: string;
  price: number | null;
  promotionText: string;
  structuredPromotion: CityGrossStructuredPromotion;
  flyerPdfUrls: string[];
  sourceUrl: string;
  productUrl: string;
  imageUrl: string;
  retrievedAt: string;
};

type CityGrossFlyerOfferInput = Record<string, unknown>;

export const CITY_GROSS_FLYER_URL = 'https://www.citygross.se/erbjudanden';

export type FetchCityGrossFlyerOffersOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
};

export function buildCityGrossFlyerUrl(): string {
  return CITY_GROSS_FLYER_URL;
}

export async function fetchCityGrossFlyerOffers(options: FetchCityGrossFlyerOffersOptions = {}): Promise<CityGrossFlyerOffer[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? buildCityGrossFlyerUrl();
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`City Gross flyer request failed: ${response.status}`);
  return parseCityGrossFlyerOffers(await response.text(), sourceUrl, retrievedAt).slice(0, options.maxRows);
}

export function parseCityGrossFlyerOffers(html: string, sourceUrl = CITY_GROSS_FLYER_URL, retrievedAt = new Date().toISOString()): CityGrossFlyerOffer[] {
  const flyerPdfUrls = extractCityGrossFlyerPdfUrls(html, sourceUrl);
  const rows: CityGrossFlyerOffer[] = [];
  const seen = new Set<string>();

  for (const item of extractCityGrossOfferInputs(html)) {
    const row = normalizeCityGrossFlyerOffer(item, { flyerPdfUrls, sourceUrl, retrievedAt });
    if (!row || seen.has(row.code)) continue;
    seen.add(row.code);
    rows.push(row);
  }

  return rows;
}

export function extractCityGrossFlyerPdfUrls(html: string, sourceUrl = CITY_GROSS_FLYER_URL): string[] {
  const urls = new Set<string>();
  for (const match of html.matchAll(/href=["']([^"']*(?:reklamblad|erbjudanden)[^"']*\.pdf[^"']*)["']/giu)) {
    if (match[1]) urls.add(new URL(match[1], sourceUrl).toString());
  }
  return [...urls];
}

export function normalizeCityGrossFlyerOffer(
  item: CityGrossFlyerOfferInput,
  context: { flyerPdfUrls?: string[]; sourceUrl: string; retrievedAt: string }
): CityGrossFlyerOffer | null {
  const name = text(item.name ?? item.title ?? item.productName);
  const promotionText = text(item.promotionText ?? item.promoText ?? item.offerText ?? item.description ?? item.priceText);
  const code = text(item.code ?? item.id ?? item.gtin ?? item.productId) || stableCode(`${name}:${promotionText}`);
  if (!name || !promotionText) return null;

  const price = numberOrNull(item.price ?? item.offerPrice ?? item.campaignPrice);
  return {
    code,
    name,
    brand: text(item.brand ?? item.brandName),
    price,
    promotionText,
    structuredPromotion: routeCityGrossPromotion(promotionText),
    flyerPdfUrls: context.flyerPdfUrls ?? [],
    sourceUrl: context.sourceUrl,
    productUrl: absoluteUrl(text(item.url ?? item.href ?? item.productUrl), context.sourceUrl),
    imageUrl: absoluteUrl(text(item.imageUrl ?? item.image ?? item.imagePath), context.sourceUrl),
    retrievedAt: context.retrievedAt
  };
}

export function routeCityGrossPromotion(textValue: string): CityGrossStructuredPromotion {
  const normalized = textValue.trim().toLocaleLowerCase('sv-SE').replace(/\s+/g, ' ');
  const percentMatch = normalized.match(/([-−–—])?\s*(\d{1,3})\s*%/u);
  if (percentMatch) return { kind: 'percent_off', pct: Number(percentMatch[2]) };

  const bulkMatch = normalized.match(/(\d+)\s*(?:för|for)\s*(\d+(?:[,.]\d+)?)/u);
  if (bulkMatch) return { kind: 'bulk_price', quantity: Number(bulkMatch[1]), price: decimal(bulkMatch[2]) };

  const priceMatch = normalized.match(/(\d+(?:[,.]\d+)?)\s*(?:kr|:-)/u);
  if (priceMatch) return { kind: 'fixed_price', price: decimal(priceMatch[1]) };

  if (/familj|family|storpack|maxipack/u.test(normalized)) return { kind: 'family_size', text: textValue };
  return { kind: 'unknown', text: textValue };
}

function extractCityGrossOfferInputs(html: string): CityGrossFlyerOfferInput[] {
  const inputs: CityGrossFlyerOfferInput[] = [];
  for (const candidate of extractJsonCandidates(html)) {
    try {
      collectOfferObjects(JSON.parse(candidate), inputs);
    } catch {
      // Continue with other script payloads.
    }
  }
  return inputs;
}

function extractJsonCandidates(html: string): string[] {
  const candidates: string[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/giu)) {
    if (match[1]) candidates.push(htmlDecode(match[1]));
  }
  const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/iu);
  if (nextDataMatch?.[1]) candidates.push(htmlDecode(nextDataMatch[1]));
  return candidates;
}

function collectOfferObjects(value: unknown, rows: CityGrossFlyerOfferInput[]): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) collectOfferObjects(item, rows);
    return;
  }

  const record = value as CityGrossFlyerOfferInput;
  const hasName = Boolean(record.name ?? record.title ?? record.productName);
  const hasPromotion = Boolean(record.promotionText ?? record.promoText ?? record.offerText ?? record.description ?? record.priceText);
  if (hasName && hasPromotion) rows.push(record);

  for (const child of Object.values(record)) collectOfferObjects(child, rows);
}

function absoluteUrl(value: string, baseUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return '';
  }
}

function decimal(value: string | undefined): number {
  return Number.parseFloat((value ?? '0').replace(',', '.'));
}

function numberOrNull(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const match = text(value).replace(/\s/g, '').replace(',', '.').match(/\d+(?:\.\d+)?/u);
  return match ? Number.parseFloat(match[0]) : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function htmlDecode(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#x27;/g, "'");
}

function stableCode(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return `citygross-flyer-${Math.abs(hash)}`;
}
