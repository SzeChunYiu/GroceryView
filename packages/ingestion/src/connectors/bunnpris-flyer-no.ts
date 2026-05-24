export type BunnprisFlyerNoPromotionRow = {
  id: string;
  retailer: 'Bunnpris';
  country: 'NO';
  currency: 'NOK';
  title: string;
  description: string;
  price: number | null;
  priceText: string;
  imageUrl: string;
  flyerUrl: string;
  sourceUrl: string;
  validFrom: string;
  validTo: string;
  retrievedAt: string;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export type FetchBunnprisFlyerNoOptions = {
  fetchImpl?: FetchLike;
  retrievedAt?: string;
  sourceUrl?: string;
};

const DEFAULT_SOURCE_URL = 'https://bunnpris.no/erbjudanden';
const RETAILER = 'Bunnpris' as const;
const COUNTRY = 'NO' as const;
const CURRENCY = 'NOK' as const;

function stripTags(value: string) {
  return decodeHtml(value.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function absoluteUrl(value: string, sourceUrl: string) {
  if (!value) return '';
  try {
    return new URL(decodeHtml(value), sourceUrl).toString();
  } catch {
    return '';
  }
}

function priceFromText(value: string) {
  const match = value.replace(/\s+/g, ' ').match(/(?:kr|,-)?\s*(\d{1,4})(?:[,.](\d{1,2}))?\s*(?:kr|,-)/i);
  if (!match) return null;
  const price = Number(`${match[1]!}.${match[2] ?? '00'}`);
  return Number.isFinite(price) ? price : null;
}

function rowIdFor(title: string, priceText: string, index: number) {
  const slug = `${title}-${priceText}`
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `bunnpris-no-${slug || index}`;
}

function datesFromText(text: string) {
  const match = text.match(/(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?\s*(?:-|–|til|t\.o\.m\.)\s*(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?/i);
  if (!match) return { validFrom: '', validTo: '' };
  const currentYear = new Date().getUTCFullYear();
  const fromYear = Number(match[3] ? match[3].padStart(4, '20') : currentYear);
  const toYear = Number(match[6] ? match[6].padStart(4, '20') : fromYear);
  const validFrom = `${fromYear}-${match[2]!.padStart(2, '0')}-${match[1]!.padStart(2, '0')}`;
  const validTo = `${toYear}-${match[5]!.padStart(2, '0')}-${match[4]!.padStart(2, '0')}`;
  return { validFrom, validTo };
}

function rowsFromJsonLd(html: string, sourceUrl: string, retrievedAt: string) {
  const rows: BunnprisFlyerNoPromotionRow[] = [];
  const scripts = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(script[1] ?? '').trim());
      const nodes = Array.isArray(parsed) ? parsed : [parsed, ...(Array.isArray(parsed?.['@graph']) ? parsed['@graph'] : [])];
      for (const node of nodes) {
        const offers = Array.isArray(node?.offers) ? node.offers : node?.offers ? [node.offers] : [];
        for (const offer of offers) {
          const title = stripTags(String(node?.name ?? offer?.name ?? ''));
          if (!title) continue;
          const price = typeof offer?.price === 'number' ? offer.price : priceFromText(String(offer?.price ?? ''));
          const priceText = price === null ? '' : `${price} kr`;
          rows.push({
            id: rowIdFor(title, priceText, rows.length),
            retailer: RETAILER,
            country: COUNTRY,
            currency: CURRENCY,
            title,
            description: stripTags(String(node?.description ?? offer?.description ?? '')),
            price,
            priceText,
            imageUrl: absoluteUrl(Array.isArray(node?.image) ? String(node.image[0] ?? '') : String(node?.image ?? ''), sourceUrl),
            flyerUrl: absoluteUrl(String(offer?.url ?? node?.url ?? sourceUrl), sourceUrl),
            sourceUrl,
            validFrom: String(offer?.validFrom ?? ''),
            validTo: String(offer?.validThrough ?? offer?.validTo ?? ''),
            retrievedAt
          });
        }
      }
    } catch {
      // Ignore malformed JSON-LD and keep the HTML card fallback active.
    }
  }
  return rows;
}

function rowsFromHtmlCards(html: string, sourceUrl: string, retrievedAt: string) {
  const candidates = html.match(/<(?:article|li|div)\b[^>]*(?:offer|product|campaign|tilbud|erbjud)[^>]*>[\s\S]*?<\/(?:article|li|div)>/gi) ?? [];
  const rows: BunnprisFlyerNoPromotionRow[] = [];
  for (const candidate of candidates) {
    const text = stripTags(candidate);
    const price = priceFromText(text);
    if (price === null) continue;
    const heading = candidate.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1] ?? text.split(/\s{2,}| kr |,-/i)[0] ?? '';
    const title = stripTags(heading).slice(0, 120);
    if (!title) continue;
    const imageUrl = absoluteUrl(candidate.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ?? '', sourceUrl);
    const flyerUrl = absoluteUrl(candidate.match(/<a[^>]+href=["']([^"']+)["']/i)?.[1] ?? sourceUrl, sourceUrl);
    const { validFrom, validTo } = datesFromText(text);
    const priceText = `${price} kr`;
    rows.push({
      id: rowIdFor(title, priceText, rows.length),
      retailer: RETAILER,
      country: COUNTRY,
      currency: CURRENCY,
      title,
      description: text,
      price,
      priceText,
      imageUrl,
      flyerUrl,
      sourceUrl,
      validFrom,
      validTo,
      retrievedAt
    });
  }
  return rows;
}

export function parseBunnprisFlyerNoHtml(html: string, sourceUrl = DEFAULT_SOURCE_URL, retrievedAt = new Date().toISOString()) {
  const rows = [...rowsFromJsonLd(html, sourceUrl, retrievedAt), ...rowsFromHtmlCards(html, sourceUrl, retrievedAt)];
  const uniqueRows = new Map<string, BunnprisFlyerNoPromotionRow>();
  for (const row of rows) {
    uniqueRows.set(`${row.title}-${row.priceText}-${row.flyerUrl}`, row);
  }
  return [...uniqueRows.values()];
}

export async function fetchBunnprisFlyerNoPromotions(options: FetchBunnprisFlyerNoOptions = {}) {
  const sourceUrl = options.sourceUrl ?? DEFAULT_SOURCE_URL;
  const fetchImpl = options.fetchImpl ?? (globalThis.fetch as FetchLike | undefined);
  if (!fetchImpl) throw new Error('fetchBunnprisFlyerNoPromotions requires a fetch implementation');
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion (+https://groceryview.example)'
    }
  });
  if (!response.ok) throw new Error(`Bunnpris flyer fetch failed with HTTP ${response.status}`);
  const html = await response.text();
  return parseBunnprisFlyerNoHtml(html, sourceUrl, options.retrievedAt ?? new Date().toISOString());
}
