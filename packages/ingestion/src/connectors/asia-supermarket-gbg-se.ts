import { isGroceryOverlapCategory, type GroceryOverlapCategory } from './overlapCategories.js';

export const ASIA_SUPERMARKET_GBG_SOURCE_URL = 'https://www.kvillessaluhall.se/butiker/asianfoodstore/';
export const ASIA_SUPERMARKET_GBG_CHAIN = 'asia-supermarket-gbg';
export const ASIA_SUPERMARKET_GBG_PARSER_VERSION = 'asia-supermarket-gbg-se-v1';
export const ASIA_SUPERMARKET_GBG_REQUIRED_STORE_COUNT = 3;

export const ASIA_SUPERMARKET_GBG_CATEGORY_WHITELIST = [
  'pantry',
  'rice_noodles',
  'frozen',
  'seafood',
  'sauces_condiments',
  'snacks',
  'beverages'
] as const satisfies readonly GroceryOverlapCategory[];

export type AsiaSupermarketGbgCategory = typeof ASIA_SUPERMARKET_GBG_CATEGORY_WHITELIST[number];

export type AsiaSupermarketGbgStore = {
  storeId: string;
  name: string;
  address: string;
  city: 'Göteborg';
  country: 'SE';
  sourceUrl: string;
};

export type AsiaSupermarketGbgAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: typeof ASIA_SUPERMARKET_GBG_CHAIN;
  retailer_type: 'ethnic_asian';
  code: string;
  name: string;
  category: AsiaSupermarketGbgCategory;
  price: null;
  priceText: '';
  available: true;
  storeId: string;
  storeName: string;
  city: 'Göteborg';
  address: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'kville_saluhall_asian_foodstore';
    parserVersion: typeof ASIA_SUPERMARKET_GBG_PARSER_VERSION;
    evidenceText: string;
  };
};

export type AsiaSupermarketGbgSkipNote = {
  chain: typeof ASIA_SUPERMARKET_GBG_CHAIN;
  country: 'SE';
  retailer_type: 'ethnic_asian';
  status: 'skipped_below_chain_threshold';
  qualifiesForChainConnector: false;
  storeCount: number;
  requiredStoreCount: typeof ASIA_SUPERMARKET_GBG_REQUIRED_STORE_COUNT;
  note: string;
  evidence: Array<{
    label: string;
    sourceUrl: string;
  }>;
};

export type AsiaSupermarketGbgConnectorResult = {
  rows: AsiaSupermarketGbgAssortmentRow[];
  skipped: AsiaSupermarketGbgSkipNote | null;
};

export type FetchAsiaSupermarketGbgAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  stores?: readonly AsiaSupermarketGbgStore[];
  maxRows?: number;
};

export const ASIA_SUPERMARKET_GBG_VERIFIED_STORES = [{
  storeId: 'kville-saluhall',
  name: 'Asian Food Store Kville Saluhall',
  address: 'Gustaf Dalénsgatan 2, 417 22 Göteborg',
  city: 'Göteborg',
  country: 'SE',
  sourceUrl: ASIA_SUPERMARKET_GBG_SOURCE_URL
}] as const satisfies readonly AsiaSupermarketGbgStore[];

const CATEGORY_EVIDENCE: Array<{ category: AsiaSupermarketGbgCategory; name: string; pattern: RegExp }> = [
  { category: 'pantry', name: 'Asian pantry assortment', pattern: /(?:gyoza|dumplings|kimchi)/i },
  { category: 'rice_noodles', name: 'Rice and noodle assortment', pattern: /(?:nudlar|sticky\s+rice|jasminris|ris)/i },
  { category: 'frozen', name: 'Frozen Asian grocery assortment', pattern: /frysta/i },
  { category: 'seafood', name: 'Frozen seafood assortment', pattern: /j[aä]tter[aä]kor|seafood|räkor/i },
  { category: 'sauces_condiments', name: 'Asian sauces and marinades', pattern: /s[åa]ser|marinader|sauce/i },
  { category: 'snacks', name: 'Asian snacks and sweets', pattern: /snacks|s[öo]tsaker|godis/i },
  { category: 'beverages', name: 'Asian beverages assortment', pattern: /drickor|dryck/i }
];

export function verifyAsiaSupermarketGbgChainStatus(
  stores: readonly AsiaSupermarketGbgStore[] = ASIA_SUPERMARKET_GBG_VERIFIED_STORES
): AsiaSupermarketGbgSkipNote | null {
  if (stores.length >= ASIA_SUPERMARKET_GBG_REQUIRED_STORE_COUNT) return null;

  return {
    chain: ASIA_SUPERMARKET_GBG_CHAIN,
    country: 'SE',
    retailer_type: 'ethnic_asian',
    status: 'skipped_below_chain_threshold',
    qualifiesForChainConnector: false,
    storeCount: stores.length,
    requiredStoreCount: ASIA_SUPERMARKET_GBG_REQUIRED_STORE_COUNT,
    note: 'Skipped: verified Gothenburg Asian Food Store evidence currently covers fewer than three stores, so GroceryView should not promote it as a chain connector.',
    evidence: stores.map((store) => ({
      label: `${store.name} at ${store.address}`,
      sourceUrl: store.sourceUrl
    }))
  };
}

export async function fetchAsiaSupermarketGbgAssortment(
  options: FetchAsiaSupermarketGbgAssortmentOptions = {}
): Promise<AsiaSupermarketGbgConnectorResult> {
  const sourceUrl = options.sourceUrl ?? ASIA_SUPERMARKET_GBG_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 asia-supermarket-gbg-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Asia Supermarket Gothenburg source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Asia Supermarket Gothenburg source failed with HTTP ${response.status}.`);

  return parseAsiaSupermarketGbgAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl, options);
}

export function parseAsiaSupermarketGbgAssortment(
  html: string,
  retrievedAt: string,
  sourceUrl = ASIA_SUPERMARKET_GBG_SOURCE_URL,
  options: { stores?: readonly AsiaSupermarketGbgStore[]; maxRows?: number } = {}
): AsiaSupermarketGbgConnectorResult {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|cloudflare|logga in/i.test(text)) throw new Error('Asia Supermarket Gothenburg source returned a blocked/login page.');

  const stores = options.stores ?? ASIA_SUPERMARKET_GBG_VERIFIED_STORES;
  const skipped = verifyAsiaSupermarketGbgChainStatus(stores);
  if (skipped) return { rows: [], skipped };

  const categories = parseAsiaSupermarketGbgCategories(text);
  if (categories.length === 0) throw new Error('Asia Supermarket Gothenburg source had no grocery-overlap categories.');

  const rows: AsiaSupermarketGbgAssortmentRow[] = [];
  for (const store of stores) {
    for (const category of categories) {
      rows.push({
        country: 'SE',
        currency: 'SEK',
        chain: ASIA_SUPERMARKET_GBG_CHAIN,
        retailer_type: 'ethnic_asian',
        code: `${ASIA_SUPERMARKET_GBG_CHAIN}:${store.storeId}:${category.category}`,
        name: category.name,
        category: category.category,
        price: null,
        priceText: '',
        available: true,
        storeId: store.storeId,
        storeName: store.name,
        city: store.city,
        address: store.address,
        sourceUrl,
        retrievedAt,
        provenance: {
          source: 'kville_saluhall_asian_foodstore',
          parserVersion: ASIA_SUPERMARKET_GBG_PARSER_VERSION,
          evidenceText: category.evidenceText
        }
      });
      if (options.maxRows && rows.length >= options.maxRows) return { rows, skipped: null };
    }
  }

  return { rows, skipped: null };
}

export function parseAsiaSupermarketGbgCategories(textOrHtml: string): Array<{
  category: AsiaSupermarketGbgCategory;
  name: string;
  evidenceText: string;
}> {
  const text = decodeHtmlText(textOrHtml);
  return CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedAsiaSupermarketGbgCategory(entry.category));
}

export function isWhitelistedAsiaSupermarketGbgCategory(category: string): category is AsiaSupermarketGbgCategory {
  return isGroceryOverlapCategory(category) && (ASIA_SUPERMARKET_GBG_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&aring;/gi, 'å')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
