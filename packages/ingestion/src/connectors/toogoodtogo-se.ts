export const TOOGOODTOGO_SE_STOCKHOLM_LISTING_URLS = [
  'https://www.toogoodtogo.com/sv/find/stockholm/circlekstockholmroslagstull/other/overraskningskasse-845701',
  'https://www.toogoodtogo.com/sv/find/stockholm/direkten/other/snackskasse-56426428088843392',
  'https://www.toogoodtogo.com/sv/find/stockholm/scandicsjofartshotellet/meal/surprisebag-100519480338839136'
] as const;

export type TooGoodToGoSeSurplusObservation = {
  domain: 'surplus_food';
  chainId: 'toogoodtogo_se';
  country: 'SE';
  city: string;
  storeName: string;
  storeSlug: string;
  bagName: string;
  category: string;
  address: string;
  originalPrice: number;
  discountedPrice: number;
  price: number;
  currency: 'SEK';
  unit: 'magic_bag';
  is_surplus: true;
  sourceUrl: string;
  capturedAt: string;
  provenance: {
    source: 'toogoodtogo_public_listing';
    parserVersion: 'toogoodtogo-se-listing-v1';
    originalPriceText: string;
    discountedPriceText: string;
  };
};

export async function fetchTooGoodToGoSeSurplusListings(options: {
  fetchImpl?: typeof fetch;
  listingUrls?: readonly string[];
  capturedAt?: string;
} = {}): Promise<TooGoodToGoSeSurplusObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const listingUrls = options.listingUrls ?? TOOGOODTOGO_SE_STOCKHOLM_LISTING_URLS;
  const rows: TooGoodToGoSeSurplusObservation[] = [];

  for (const sourceUrl of listingUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 TooGoodToGo Sweden surplus connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Too Good To Go Sweden listing blocked with HTTP ${response.status}: ${sourceUrl}`);
    }
    if (!response.ok) throw new Error(`Too Good To Go Sweden listing failed with HTTP ${response.status}: ${sourceUrl}`);
    const html = await response.text();
    if (/Vercel Security Checkpoint|captcha|access denied/i.test(html)) {
      throw new Error(`Too Good To Go Sweden listing returned an anti-bot checkpoint: ${sourceUrl}`);
    }
    rows.push(parseTooGoodToGoSeListingPage(html, { sourceUrl, capturedAt }));
  }

  return rows;
}

export function parseTooGoodToGoSeListingPage(
  html: string,
  context: { sourceUrl: string; capturedAt: string }
): TooGoodToGoSeSurplusObservation {
  const text = decodeHtmlText(html);
  const title = tagText(html, 'title');
  const storeName = tagText(html, 'h1') || title.split('|')[0]?.replace(/\([^)]*\)/g, '').trim() || '';
  const priceMatch = text.match(/(\d+(?:[\s.]*\d+)*,\d{2})\s*kr\s+(\d+(?:[\s.]*\d+)*,\d{2})\s*kr/i);
  if (!storeName) throw new Error('Too Good To Go Sweden listing store name missing.');
  if (!priceMatch) throw new Error(`Too Good To Go Sweden listing price pair missing: ${context.sourceUrl}`);

  const bagName = title.match(/\(([^)]+)\)/)?.[1]?.trim()
    || text.match(/\(([^)]+kasse[^)]*)\)/i)?.[1]?.trim()
    || 'Surprise Bag';
  const { city, storeSlug, category } = listingParts(context.sourceUrl);

  return {
    domain: 'surplus_food',
    chainId: 'toogoodtogo_se',
    country: 'SE',
    city,
    storeName,
    storeSlug,
    bagName,
    category,
    address: parseSwedishAddress(text),
    originalPrice: parseSwedishKronor(priceMatch[1]!),
    discountedPrice: parseSwedishKronor(priceMatch[2]!),
    price: parseSwedishKronor(priceMatch[2]!),
    currency: 'SEK',
    unit: 'magic_bag',
    is_surplus: true,
    sourceUrl: context.sourceUrl,
    capturedAt: context.capturedAt,
    provenance: {
      source: 'toogoodtogo_public_listing',
      parserVersion: 'toogoodtogo-se-listing-v1',
      originalPriceText: `${priceMatch[1]} kr`,
      discountedPriceText: `${priceMatch[2]} kr`
    }
  };
}

function listingParts(sourceUrl: string): { city: string; storeSlug: string; category: string } {
  const match = sourceUrl.match(/\/find\/([^/]+)\/([^/]+)\/([^/]+)\//i);
  if (!match) throw new Error(`Unsupported Too Good To Go Sweden listing URL: ${sourceUrl}`);
  return {
    city: decodeURIComponent(match[1]!),
    storeSlug: decodeURIComponent(match[2]!),
    category: decodeURIComponent(match[3]!).toUpperCase()
  };
}

function tagText(html: string, tagName: string): string {
  const match = html.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, 'i'));
  return match ? decodeHtmlText(match[1]!) : '';
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSwedishAddress(text: string): string {
  const match = text.match(/([A-ZÅÄÖ][A-ZÅÄÖa-zåäö0-9.'’\-]+(?:\s+[A-ZÅÄÖa-zåäö0-9.'’\-]+){0,6}\s+\d+[A-Z]?,\s*\d{3}\s*\d{2}\s+[A-ZÅÄÖa-zåäö\- ]+,\s*(?:Sverige|Sweden))/);
  return match?.[1]?.trim() ?? '';
}

function parseSwedishKronor(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\s|\./g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Too Good To Go Sweden price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}
