export const REKLAMBLAD_SE_BASE_URL = 'https://www.reklambladerbjudanden.se';
export const REKLAMBLAD_SE_PARSER_VERSION = 'reklamblad-se-weekly-v1';

export type ReklambladSeChainId =
  | 'coop'
  | 'willys'
  | 'hemkop'
  | 'lidl'
  | 'city-gross'
  | 'ica-kvantum'
  | 'ica-supermarket'
  | 'ica-nara'
  | 'maxi-ica-stormarknad';

export type ReklambladSeDealObservation = {
  country: 'SE';
  currency: 'SEK';
  source: 'reklamblad-se';
  chain: ReklambladSeChainId;
  code: string;
  name: string;
  storeName: string;
  price: number;
  priceText: string;
  validRemainingText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  is_deal: true;
  is_member_price: boolean;
  promotionType: 'weekly_flyer';
  provenance: {
    source: 'reklamblad_se_offer_card';
    parserVersion: typeof REKLAMBLAD_SE_PARSER_VERSION;
    evidenceText: string;
  };
};

export type FetchReklambladSeDealsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const DEFAULT_REKLAMBLAD_SE_SOURCE_URLS = [
  `${REKLAMBLAD_SE_BASE_URL}/butiker/coop/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/willys/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/hemkop/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/lidl/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/city-gross/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/ica-kvantum/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/ica-supermarket/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/ica-nara/erbjudanden`,
  `${REKLAMBLAD_SE_BASE_URL}/butiker/maxi-ica-stormarknad/erbjudanden`
] as const;

export async function fetchReklambladSeDeals(options: FetchReklambladSeDealsOptions = {}): Promise<ReklambladSeDealObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const sourceUrls = options.sourceUrls ?? (options.sourceUrl ? [options.sourceUrl] : DEFAULT_REKLAMBLAD_SE_SOURCE_URLS);
  const maxRows = options.maxRows ?? 1000;
  const rows: ReklambladSeDealObservation[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 reklamblad-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Reklamblad.se source blocked for ${sourceUrl} with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Reklamblad.se source failed for ${sourceUrl} with HTTP ${response.status}.`);

    rows.push(...parseReklambladSeDeals(await response.text(), sourceUrl, retrievedAt, maxRows - rows.length));
    if (rows.length >= maxRows) return rows;
  }

  return rows;
}

export function parseReklambladSeDeals(
  html: string,
  sourceUrl: string,
  retrievedAt: string,
  maxRows = 150
): ReklambladSeDealObservation[] {
  if (!/(?:reklamblad|reklambladerbjudanden)\.se/i.test(sourceUrl)) {
    throw new Error('Reklamblad.se connector only accepts reklamblad.se/reklambladerbjudanden.se source URLs.');
  }
  if (/captcha|access denied|cloudflare|logga in för att fortsätta/i.test(html)) {
    throw new Error('Reklamblad.se source returned a blocked/login page.');
  }
  const chain = chainFromSourceUrl(sourceUrl);
  const rows: ReklambladSeDealObservation[] = [];
  const seen = new Set<string>();

  for (const block of offerBlocks(html)) {
    const code = attr(block, 'data-offer-id');
    const name = textFromHtml(
      firstMatch(block, [
        /<h3\b[^>]*class=["'][^"']*product__name[^"']*["'][^>]*>([\s\S]*?)<\/h3>/i,
        /data-offer-name=["']([^"']+)["']/i
      ])
    );
    const priceText = textFromHtml(firstMatch(block, [/<div\b[^>]*class=["'][^"']*product__price-offer[^"']*["'][^>]*>([\s\S]*?)<\/div>/i]));
    const price = parseSwedishPrice(priceText);
    if (!code || !name || price === null || seen.has(code)) continue;
    seen.add(code);
    const href = firstMatch(block, [/href=["']([^"']+)["']/i]);
    const image = firstMatch(block, [/<div\b[^>]*class=["'][^"']*product__image[^"']*["'][^>]*>[\s\S]*?<img\b[^>]+src=["']([^"']+)["']/i]);
    const storeName = textFromHtml(firstMatch(block, [/<div\b[^>]*class=["'][^"']*store-image[^"']*["'][^>]*>[\s\S]*?<img\b[^>]*alt=["']([^"']+)["']/i])) || chain;

    rows.push({
      country: 'SE',
      currency: 'SEK',
      source: 'reklamblad-se',
      chain,
      code,
      name,
      storeName,
      price,
      priceText,
      validRemainingText: textFromHtml(firstMatch(block, [/<div\b[^>]*class=["'][^"']*product-date[^"']*["'][^>]*>([\s\S]*?)<\/div>/i])),
      productUrl: href ? absoluteUrl(href, sourceUrl) : sourceUrl,
      imageUrl: image ? absoluteUrl(image, sourceUrl) : '',
      sourceUrl,
      retrievedAt,
      is_deal: true,
      is_member_price: /\bmedlemspris\b/i.test(`${name} ${attr(block, 'title')}`),
      promotionType: 'weekly_flyer',
      provenance: {
        source: 'reklamblad_se_offer_card',
        parserVersion: REKLAMBLAD_SE_PARSER_VERSION,
        evidenceText: textFromHtml(block).slice(0, 260)
      }
    });
    if (rows.length >= maxRows) break;
  }

  if (rows.length === 0) throw new Error('Reklamblad.se source had no parseable weekly deal rows.');
  return rows;
}

function offerBlocks(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*class=["'][^"']*js-offer-link-item[^"']*["'][^>]*>[\s\S]*?<\/a>/gi)].map((match) => match[0]);
}

function chainFromSourceUrl(sourceUrl: string): ReklambladSeChainId {
  const slug = sourceUrl.match(/\/butiker\/([^/]+)\/erbjudanden/i)?.[1] ?? '';
  if (isReklambladChainId(slug)) return slug;
  throw new Error(`Unsupported Reklamblad.se chain slug: ${slug}`);
}

function isReklambladChainId(value: string): value is ReklambladSeChainId {
  return ['coop', 'willys', 'hemkop', 'lidl', 'city-gross', 'ica-kvantum', 'ica-supermarket', 'ica-nara', 'maxi-ica-stormarknad'].includes(value);
}

function attr(block: string, name: string): string {
  const match = block.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'));
  return match?.[1] ? decodeHtml(match[1]) : '';
}

function firstMatch(value: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = value.match(pattern);
    if (match?.[1]) return match[1];
  }
  return '';
}

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' '))
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSwedishPrice(value: string): number | null {
  const match = textFromHtml(value).replace(/\s/g, '').match(/(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/);
  if (!match) return null;
  const parsed = Number(match[1]!.replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: string, sourceUrl: string): string {
  try {
    return new URL(decodeHtml(value), sourceUrl).toString();
  } catch {
    return '';
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
