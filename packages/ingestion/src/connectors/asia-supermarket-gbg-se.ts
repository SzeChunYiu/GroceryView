import { isOverlapCategory, type OverlapCategory } from './overlapCategories.js';

export const ASIA_SUPERMARKET_GBG_SOURCE_URL = 'https://www.kvillessaluhall.se/butiker/asianfoodstore/';
export const ASIA_SUPERMARKET_GBG_CHAIN_ID = 'asia-supermarket-gbg';
export const ASIA_SUPERMARKET_GBG_MINIMUM_STORES = 3;

export type AsiaSupermarketGbgFixtureInput = {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
};

export type AsiaSupermarketGbgRow = {
  id: string;
  name: string;
  category: OverlapCategory;
  price: number;
  unit: string;
  country: 'SE';
  currency: 'SEK';
  chain: typeof ASIA_SUPERMARKET_GBG_CHAIN_ID;
  retailer_type: 'ethnic_asian';
  source_url: string;
};

export type AsiaSupermarketGbgSkipResult = {
  status: 'skipped';
  chain: typeof ASIA_SUPERMARKET_GBG_CHAIN_ID;
  retailer_type: 'ethnic_asian';
  country: 'SE';
  currency: 'SEK';
  store_count: number;
  minimum_store_count: typeof ASIA_SUPERMARKET_GBG_MINIMUM_STORES;
  note: string;
  source_url: string;
  evidence: string[];
  rows: [];
};

export type AsiaSupermarketGbgResult =
  | AsiaSupermarketGbgSkipResult
  | {
      status: 'included';
      chain: typeof ASIA_SUPERMARKET_GBG_CHAIN_ID;
      retailer_type: 'ethnic_asian';
      country: 'SE';
      currency: 'SEK';
      store_count: number;
      minimum_store_count: typeof ASIA_SUPERMARKET_GBG_MINIMUM_STORES;
      source_url: string;
      evidence: string[];
      rows: AsiaSupermarketGbgRow[];
    };

export async function fetchAsiaSupermarketGbgRows(options: {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  fixtureRows?: AsiaSupermarketGbgFixtureInput[];
} = {}): Promise<AsiaSupermarketGbgResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? ASIA_SUPERMARKET_GBG_SOURCE_URL;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 asia-supermarket-gbg connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Asia Supermarket Gothenburg source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Asia Supermarket Gothenburg source failed with HTTP ${response.status}.`);

  return parseAsiaSupermarketGbgSource(await response.text(), {
    sourceUrl,
    fixtureRows: options.fixtureRows
  });
}

export function parseAsiaSupermarketGbgSource(
  html: string,
  options: {
    sourceUrl?: string;
    fixtureRows?: AsiaSupermarketGbgFixtureInput[];
  } = {}
): AsiaSupermarketGbgResult {
  const sourceUrl = options.sourceUrl ?? ASIA_SUPERMARKET_GBG_SOURCE_URL;
  const text = decodeHtmlText(html);
  const evidence = evidenceForSource(text);
  const storeCount = evidence.length;

  if (storeCount < ASIA_SUPERMARKET_GBG_MINIMUM_STORES) {
    return {
      status: 'skipped',
      chain: ASIA_SUPERMARKET_GBG_CHAIN_ID,
      retailer_type: 'ethnic_asian',
      country: 'SE',
      currency: 'SEK',
      store_count: storeCount,
      minimum_store_count: ASIA_SUPERMARKET_GBG_MINIMUM_STORES,
      note: `Skipped ${ASIA_SUPERMARKET_GBG_CHAIN_ID}: source confirms ${storeCount} store(s), below the ${ASIA_SUPERMARKET_GBG_MINIMUM_STORES}-store chain threshold.`,
      source_url: sourceUrl,
      evidence,
      rows: []
    };
  }

  return {
    status: 'included',
    chain: ASIA_SUPERMARKET_GBG_CHAIN_ID,
    retailer_type: 'ethnic_asian',
    country: 'SE',
    currency: 'SEK',
    store_count: storeCount,
    minimum_store_count: ASIA_SUPERMARKET_GBG_MINIMUM_STORES,
    source_url: sourceUrl,
    evidence,
    rows: applyAsiaSupermarketGbgCategoryWhitelist(options.fixtureRows ?? [], sourceUrl)
  };
}

export function applyAsiaSupermarketGbgCategoryWhitelist(rows: AsiaSupermarketGbgFixtureInput[], sourceUrl = ASIA_SUPERMARKET_GBG_SOURCE_URL): AsiaSupermarketGbgRow[] {
  return rows.flatMap((row) => {
    if (!isOverlapCategory(row.category)) return [];
    return [{
      id: row.id,
      name: row.name,
      category: row.category,
      price: row.price,
      unit: row.unit,
      country: 'SE',
      currency: 'SEK',
      chain: ASIA_SUPERMARKET_GBG_CHAIN_ID,
      retailer_type: 'ethnic_asian',
      source_url: sourceUrl
    }];
  });
}

function evidenceForSource(text: string): string[] {
  const evidence: string[] = [];
  const sourceMatches = text.match(/Asian Food Store[\s\S]{0,240}?Gustaf\s+Dal[eé]nsgatan\s+2/gi) ?? [];
  for (let index = 0; index < sourceMatches.length; index += 1) {
    evidence.push('Asian Food Store, Gustaf Dalénsgatan 2, 417 22 Göteborg');
  }
  return evidence;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&eacute;/g, 'é')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
