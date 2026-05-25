export const KOSHER_DELI_SE_JFST_URL = 'https://jfst.se/fler-tjanster/kosherinformation/kosherian-i-bajit-makolet/';
export const KOSHER_DELI_SE_STOCKHOLM_GUIDE_URL = 'https://jfst.se/for-english-speakers/kosher/';
export const KOSHER_DELI_SE_PARSER_VERSION = 'kosher-deli-se-makolet-v1';

export const KOSHER_DELI_SE_CATEGORY_WHITELIST = ['meat_deli', 'dairy', 'pantry'] as const;
export type KosherDeliSeCategory = typeof KOSHER_DELI_SE_CATEGORY_WHITELIST[number];

export type KosherDeliSeStore = {
  storeId: 'makolet-bajit';
  name: 'Makolet i Bajit';
  address: 'Nybrogatan 19A';
  city: 'Stockholm';
  country: 'SE';
  sourceUrl: string;
};

export type KosherDeliSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'kosher-deli';
  operatorName: 'Makolet i Bajit';
  retailer_type: 'kosher_halal';
  code: string;
  name: string;
  category: KosherDeliSeCategory;
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
    source: 'jfst_kosherian_makolet_page';
    parserVersion: string;
    evidenceText: string;
  };
};

export type KosherDeliSeCoverageStatus = {
  chain: 'kosher-deli';
  operatorName: 'Makolet i Bajit';
  country: 'SE';
  retailer_type: 'kosher_halal';
  status: 'limited_single_verified_store';
  qualifiesForChainConnector: false;
  storeCount: 1;
  evidence: Array<{ kind: 'community_page' | 'stockholm_guide'; label: string; sourceUrl: string }>;
  caveat: string;
};

export type FetchKosherDeliSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: KosherDeliSeCategory; name: string; pattern: RegExp }> = [
  { category: 'meat_deli', name: 'Kosher meat and deli products', pattern: /(?:köttprodukter|meat)[^.]*?(?:charkuterier|ready to eat meats)/i },
  { category: 'dairy', name: 'Kosher dairy products', pattern: /(?:mejeriprodukter|cheeses?)/i },
  { category: 'pantry', name: 'Kosher dry goods, sweets and international pantry', pattern: /(?:torrvaror|sötsaker|international food items|snacks)/i }
];

export const KOSHER_DELI_SE_COVERAGE_STATUS: KosherDeliSeCoverageStatus = {
  chain: 'kosher-deli',
  operatorName: 'Makolet i Bajit',
  country: 'SE',
  retailer_type: 'kosher_halal',
  status: 'limited_single_verified_store',
  qualifiesForChainConnector: false,
  storeCount: 1,
  evidence: [
    {
      kind: 'community_page',
      label: 'JF Stockholm describes Makolet as a grocery store for kosher goods from around the world with meat products, deli, dry goods, dairy, sweets and more.',
      sourceUrl: KOSHER_DELI_SE_JFST_URL
    },
    {
      kind: 'stockholm_guide',
      label: 'The Stockholm kosher guide lists one Kosherian kosher shop at Nybrogatan 19A where meat, cheese and other kosher items can be purchased.',
      sourceUrl: KOSHER_DELI_SE_STOCKHOLM_GUIDE_URL
    }
  ],
  caveat: 'Primary sources verified one Stockholm kosher grocery/deli location rather than a multi-location Swedish chain; rows are emitted with an explicit limited-coverage status instead of silently inventing a chain footprint.'
};

export async function fetchKosherDeliSeAssortment(options: FetchKosherDeliSeAssortmentOptions = {}): Promise<KosherDeliSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? KOSHER_DELI_SE_JFST_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 kosher-deli-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Kosher Deli SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Kosher Deli SE source failed with HTTP ${response.status}.`);
  const rows = parseKosherDeliSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseKosherDeliSeAssortment(
  html: string,
  retrievedAt: string,
  sourceUrl = KOSHER_DELI_SE_JFST_URL
): KosherDeliSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Kosher Deli SE source returned a blocked/login page.');
  if (!/Makolet/i.test(text) || !/(koshervaror|kosher)/i.test(text)) throw new Error('Kosher Deli SE source did not verify Makolet kosher grocery coverage.');

  const store = parseKosherDeliSeStore(html, sourceUrl);
  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedKosherDeliSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Kosher Deli SE source had no grocery-overlap categories.');

  return categories.map((category) => ({
    country: 'SE',
    currency: 'SEK',
    chain: 'kosher-deli',
    operatorName: 'Makolet i Bajit',
    retailer_type: 'kosher_halal',
    code: `kosher-deli:${store.storeId}:${category.category}`,
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
      source: 'jfst_kosherian_makolet_page',
      parserVersion: KOSHER_DELI_SE_PARSER_VERSION,
      evidenceText: category.evidenceText
    }
  }));
}

export function parseKosherDeliSeStore(html: string, sourceUrl = KOSHER_DELI_SE_JFST_URL): KosherDeliSeStore {
  const text = decodeHtmlText(html);
  const hasMakolet = /Makolet/i.test(text);
  const hasAddress = /Nybrogatan\s+19A/i.test(text) || /Bajit/i.test(text);
  if (!hasMakolet || !hasAddress) throw new Error('Kosher Deli SE source did not verify the Makolet i Bajit store location.');
  return {
    storeId: 'makolet-bajit',
    name: 'Makolet i Bajit',
    address: 'Nybrogatan 19A',
    city: 'Stockholm',
    country: 'SE',
    sourceUrl
  };
}

export function isWhitelistedKosherDeliSeCategory(category: string): category is KosherDeliSeCategory {
  return (KOSHER_DELI_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyKosherDeliSeCoverageStatus(): KosherDeliSeCoverageStatus {
  return KOSHER_DELI_SE_COVERAGE_STATUS;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#246;|&ouml;/gi, 'ö')
    .replace(/&#228;|&auml;/gi, 'ä')
    .replace(/&#229;|&aring;/gi, 'å')
    .replace(/\s+/g, ' ')
    .trim();
}
