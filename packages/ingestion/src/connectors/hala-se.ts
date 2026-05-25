export const HALA_SE_SOURCE_URL = 'https://www.hitta.se/hala+livs+centrum+ab/v%C3%A4ster%C3%A5s/anvykrtu';
export const HALA_SE_PARSER_VERSION = 'hala-se-public-profile-v1';

export const HALA_SE_CATEGORY_WHITELIST = ['bakery', 'meat_deli', 'dairy', 'pantry', 'frozen'] as const;
export type HalaSeCategory = typeof HALA_SE_CATEGORY_WHITELIST[number];

export type HalaSeStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  country: 'SE';
  sourceUrl: string;
};

export type HalaSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'hala';
  operatorName: 'Hala Livs Centrum AB';
  retailer_type: 'ethnic_polish_eastern_european';
  code: string;
  name: string;
  category: HalaSeCategory;
  price: null;
  priceText: '';
  available: true;
  storeId: string;
  storeName: string;
  city: string;
  address: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'hala_se_public_profile';
    parserVersion: string;
    evidenceText: string;
  };
};

export type HalaSeChainStatus = {
  chain: 'hala';
  operatorName: 'Hala Livs Centrum AB';
  country: 'SE';
  retailer_type: 'ethnic_polish_eastern_european';
  storeCount: number;
  qualifiesForChainConnector: boolean;
  caveat: string;
};

export type FetchHalaSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: HalaSeCategory; name: string; pattern: RegExp }> = [
  { category: 'bakery', name: 'Eastern European bread and bakery assortment', pattern: /(?:br[oö]d|bread|piekarnia|bakery|bakverk)/i },
  { category: 'meat_deli', name: 'Eastern European deli meat assortment', pattern: /(?:chark|korv|kabanos|deli|meat|w[eę]dlin)/i },
  { category: 'dairy', name: 'Eastern European dairy assortment', pattern: /(?:mejeri|dairy|ost|cheese|twar[oó]g|kefir)/i },
  { category: 'pantry', name: 'Eastern European pantry assortment', pattern: /(?:polsk|eastern european|[oö]steurope|pierogi|pickles|konserver|pantry)/i },
  { category: 'frozen', name: 'Eastern European frozen food assortment', pattern: /(?:frys|fryst|frozen|pierogi)/i }
];

export async function fetchHalaSeAssortment(options: FetchHalaSeAssortmentOptions = {}): Promise<HalaSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? HALA_SE_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 hala-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Hala SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Hala SE source failed with HTTP ${response.status}.`);
  const rows = parseHalaSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseHalaSeAssortment(html: string, retrievedAt: string, sourceUrl = HALA_SE_SOURCE_URL): HalaSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Hala SE source returned a blocked/login page.');
  if (!/Hala\s+Livs/i.test(text)) throw new Error('Hala SE source did not identify Hala Livs.');

  const stores = parseHalaSeStores(html, sourceUrl);
  if (stores.length === 0) throw new Error('Hala SE connector requires at least one verified Hala Livs store.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedHalaSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Hala SE source had no grocery-overlap categories.');

  return stores.flatMap((store) => categories.map((category) => ({
    country: 'SE' as const,
    currency: 'SEK' as const,
    chain: 'hala' as const,
    operatorName: 'Hala Livs Centrum AB' as const,
    retailer_type: 'ethnic_polish_eastern_european' as const,
    code: `hala:${store.storeId}:${category.category}`,
    name: category.name,
    category: category.category,
    price: null,
    priceText: '' as const,
    available: true as const,
    storeId: store.storeId,
    storeName: store.name,
    city: store.city,
    address: store.address,
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'hala_se_public_profile' as const,
      parserVersion: HALA_SE_PARSER_VERSION,
      evidenceText: category.evidenceText
    }
  })));
}

export function parseHalaSeStores(html: string, sourceUrl = HALA_SE_SOURCE_URL): HalaSeStore[] {
  const text = decodeHtmlText(html);
  const address = text.match(/Jakobsgatan\s+89,?\s*72[24]\s*20\s*V[aä]ster[aå]s/i)?.[0]?.replace(/\s+/g, ' ').trim() ?? '';
  if (!/Hala\s+Livs\s+Centrum\s+AB/i.test(text) || !address) return [];
  return [{ storeId: 'vasteras-jakobsgatan', name: 'Hala Livs Centrum AB', address, city: 'Västerås', country: 'SE', sourceUrl }];
}

export function verifyHalaSeChainStatus(html: string): HalaSeChainStatus {
  const storeCount = parseHalaSeStores(html).length;
  return {
    chain: 'hala',
    operatorName: 'Hala Livs Centrum AB',
    country: 'SE',
    retailer_type: 'ethnic_polish_eastern_european',
    storeCount,
    qualifiesForChainConnector: storeCount >= 1,
    caveat: storeCount >= 1
      ? 'Hala is verified as a source-backed Swedish specialty grocery operator; keep it separate from unrelated Hala/Hall names.'
      : 'No verified Hala Livs store count was found in the source snapshot.'
  };
}

export function isWhitelistedHalaSeCategory(category: string): category is HalaSeCategory {
  return (HALA_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
