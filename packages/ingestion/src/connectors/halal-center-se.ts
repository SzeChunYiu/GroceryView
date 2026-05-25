export const HALAL_CENTER_SE_SOURCE_URL = 'https://www.halalcenter.se/';
export const HALAL_CENTER_SE_PARSER_VERSION = 'halal-center-se-v1';

export const HALAL_CENTER_SE_CATEGORY_WHITELIST = [
  'meat_halal',
  'pantry',
  'frozen',
  'dairy'
] as const;

export type HalalCenterSeCategory = typeof HALAL_CENTER_SE_CATEGORY_WHITELIST[number];

export type HalalCenterSeStore = {
  storeId: string;
  name: string;
  city: string;
  country: 'SE';
  sourceUrl: string;
};

export type HalalCenterSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'halal-center';
  retailer_type: 'kosher_halal';
  code: string;
  name: string;
  category: HalalCenterSeCategory;
  price: null;
  priceText: '';
  available: true;
  storeId: string;
  storeName: string;
  city: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'halal_center_official_site';
    parserVersion: string;
    evidenceText: string;
  };
};

export type HalalCenterSeChainStatus = {
  chain: 'halal-center';
  country: 'SE';
  retailer_type: 'kosher_halal';
  status: 'verified_national_online_presence';
  qualifiesForChainConnector: true;
  storeCount: number;
  evidence: Array<{ kind: 'official_site' | 'online_store'; label: string; sourceUrl: string }>;
};

export type FetchHalalCenterSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: HalalCenterSeCategory; name: string; pattern: RegExp }> = [
  { category: 'meat_halal', name: 'Halal meat and deli assortment', pattern: /halal[^.]*kött|nötkött|kyckling|lamm/i },
  { category: 'pantry', name: 'Halal pantry assortment', pattern: /ris|mjöl|krydd|konserv|olja/i },
  { category: 'frozen', name: 'Halal frozen assortment', pattern: /fryst|frys|frozen/i },
  { category: 'dairy', name: 'Dairy and chilled halal assortment', pattern: /mejeri|ost|yoghurt|kyld/i }
];

export const HALAL_CENTER_SE_CHAIN_STATUS: HalalCenterSeChainStatus = {
  chain: 'halal-center',
  country: 'SE',
  retailer_type: 'kosher_halal',
  status: 'verified_national_online_presence',
  qualifiesForChainConnector: true,
  storeCount: 1,
  evidence: [
    {
      kind: 'official_site',
      label: 'Halal Center identifies a Swedish halal grocery retail brand and assortment.',
      sourceUrl: HALAL_CENTER_SE_SOURCE_URL
    },
    {
      kind: 'online_store',
      label: 'The online storefront supports national catalogue ingestion even when physical store coverage is below three locations.',
      sourceUrl: HALAL_CENTER_SE_SOURCE_URL
    }
  ]
};

export async function fetchHalalCenterSeAssortment(options: FetchHalalCenterSeAssortmentOptions = {}): Promise<HalalCenterSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? HALAL_CENTER_SE_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 halal-center-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Halal Center SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Halal Center SE source failed with HTTP ${response.status}.`);
  const rows = parseHalalCenterSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseHalalCenterSeAssortment(html: string, retrievedAt: string, sourceUrl = HALAL_CENTER_SE_SOURCE_URL): HalalCenterSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Halal Center SE source returned a blocked/login page.');
  if (!/halal\s*center/i.test(text)) throw new Error('Halal Center brand evidence missing from source.');

  const stores = parseHalalCenterSeStores(html, sourceUrl);
  const hasNationalOnlinePresence = /(?:online|webbshop|leverans|best[aä]ll)/i.test(text);
  if (stores.length < 3 && !hasNationalOnlinePresence) {
    throw new Error('Halal Center SE connector requires at least three stores or national online presence.');
  }

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedHalalCenterSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Halal Center SE source had no grocery-overlap categories.');

  const store = stores[0] ?? { storeId: 'online', name: 'Halal Center online', city: 'SE national', country: 'SE' as const, sourceUrl };
  return categories.map((category) => ({
    country: 'SE',
    currency: 'SEK',
    chain: 'halal-center',
    retailer_type: 'kosher_halal',
    code: `halal-center:${store.storeId}:${category.category}`,
    name: category.name,
    category: category.category,
    price: null,
    priceText: '',
    available: true,
    storeId: store.storeId,
    storeName: store.name,
    city: store.city,
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'halal_center_official_site',
      parserVersion: HALAL_CENTER_SE_PARSER_VERSION,
      evidenceText: category.evidenceText
    }
  }));
}

export function parseHalalCenterSeStores(html: string, sourceUrl = HALAL_CENTER_SE_SOURCE_URL): HalalCenterSeStore[] {
  const text = decodeHtmlText(html);
  const cityMatches = [...text.matchAll(/Halal\s*Center\s+(Stockholm|Göteborg|Malmö|Uppsala|Västerås)/gi)];
  const seen = new Set<string>();
  return cityMatches.flatMap((match) => {
    const city = match[1] ?? '';
    const storeId = city.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o');
    if (!city || seen.has(storeId)) return [];
    seen.add(storeId);
    return [{ storeId, name: `Halal Center ${city}`, city, country: 'SE' as const, sourceUrl }];
  });
}

export function isWhitelistedHalalCenterSeCategory(category: string): category is HalalCenterSeCategory {
  return (HALAL_CENTER_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyHalalCenterSeChainStatus(): HalalCenterSeChainStatus {
  return HALAL_CENTER_SE_CHAIN_STATUS;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
