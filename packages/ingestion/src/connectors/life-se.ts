export const LIFE_SE_BASE_URL = 'https://www.lifebutiken.se';
export const LIFE_SE_PRODUCTS_URL = 'https://www.lifebutiken.se/produkter';
export const LIFE_SE_STORES_URL = 'https://www.lifebutiken.se/butiker';
export const LIFE_SE_PARSER_VERSION = 'life-se-apollo-store-category-v1';
export const LIFE_SE_OBSERVED_SWEDEN_STORE_COUNT = 55;
export const LIFE_SE_OBSERVED_PRODUCT_COUNT = 1629;

export const LIFE_SE_CATEGORY_WHITELIST = [
  'supplements',
  'food_drink',
  'beauty_hygiene',
  'home_lifestyle',
  'training'
] as const;

export type LifeSeCategory = typeof LIFE_SE_CATEGORY_WHITELIST[number];

export type LifeSeStore = {
  country: 'SE';
  chain: 'life-se';
  retailerType: 'health_food';
  storeId: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  productUrl: string;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
};

export type LifeSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'life-se';
  retailerType: 'health_food';
  code: string;
  name: string;
  category: LifeSeCategory;
  price: null;
  priceText: '';
  available: true;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'life_official_public_pages';
    parserVersion: string;
    observedStoreCount: number;
    observedProductCount: number;
    evidenceText: string;
  };
};

export type LifeSeChainStatus = {
  chain: 'life-se';
  chainName: 'Life';
  country: 'SE';
  retailerType: 'health_food';
  status: 'verified_national_health_food_chain';
  qualifiesForNationalChain: true;
  qualifiesForLocationConnector: true;
  qualifiesForOnlinePriceConnector: false;
  observedSwedenStoreCount: number;
  observedProductCount: number;
  evidence: Array<{
    kind: 'official_site' | 'official_store_locator' | 'embedded_catalogue';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchLifeSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  maxRows?: number;
};

type CategoryEvidence = {
  category: LifeSeCategory;
  name: string;
  path: string;
  pattern: RegExp;
};

const CATEGORY_EVIDENCE: CategoryEvidence[] = [
  {
    category: 'supplements',
    name: 'Supplements and vitamins',
    path: '/kosttillskott',
    pattern: /Kosttillskott|Vitaminer|Mineraler/i
  },
  {
    category: 'food_drink',
    name: 'Health food and drink',
    path: '/mat-dryck',
    pattern: /Mat\s*&\s*Dryck|hälsosam\s+mat/i
  },
  {
    category: 'beauty_hygiene',
    name: 'Natural beauty and hygiene',
    path: '/skonhet',
    pattern: /Sk[oö]nhet\s*&\s*Hygien|naturlig\s+hudv[aå]rd/i
  },
  {
    category: 'home_lifestyle',
    name: 'Home and lifestyle health products',
    path: '/hem-livsstil',
    pattern: /Hem\s*&\s*Livsstil|fotv[aä]nliga\s+skor|h[aä]lsoprodukter/i
  },
  {
    category: 'training',
    name: 'Training and sport supplements',
    path: '/traning',
    pattern: /Tr[aä]ning|tr[aä]ningstillskott/i
  }
];

export const LIFE_SE_CHAIN_STATUS: LifeSeChainStatus = {
  chain: 'life-se',
  chainName: 'Life',
  country: 'SE',
  retailerType: 'health_food',
  status: 'verified_national_health_food_chain',
  qualifiesForNationalChain: true,
  qualifiesForLocationConnector: true,
  qualifiesForOnlinePriceConnector: false,
  observedSwedenStoreCount: LIFE_SE_OBSERVED_SWEDEN_STORE_COUNT,
  observedProductCount: LIFE_SE_OBSERVED_PRODUCT_COUNT,
  evidence: [
    {
      kind: 'official_site',
      label: 'Life official site describes Life as the Nordic region’s leading health chain with about 130 stores across Sweden and Norway.',
      sourceUrl: LIFE_SE_BASE_URL
    },
    {
      kind: 'official_store_locator',
      label: 'Life official Swedish store locator exposes public store entries across Sweden.',
      sourceUrl: LIFE_SE_STORES_URL
    },
    {
      kind: 'embedded_catalogue',
      label: 'Life product category page exposes public category coverage and a product-result total in the embedded Apollo state.',
      sourceUrl: LIFE_SE_PRODUCTS_URL
    }
  ],
  caveat: 'Life.se exposes category and store coverage publicly, but the category page does not server-render product-level prices for this connector. It therefore emits null-price health-food category coverage and source-backed store locations.'
};

export async function fetchLifeSeAssortment(options: FetchLifeSeAssortmentOptions = {}): Promise<LifeSeAssortmentRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const [productsHtml, storesHtml] = await Promise.all([
    fetchLifeSeHtml(fetchImpl, LIFE_SE_PRODUCTS_URL),
    fetchLifeSeHtml(fetchImpl, LIFE_SE_STORES_URL)
  ]);

  const rows = parseLifeSeAssortment(
    `${productsHtml}\n${storesHtml}`,
    options.retrievedAt ?? new Date().toISOString(),
    LIFE_SE_PRODUCTS_URL
  );
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseLifeSeAssortment(
  html: string,
  retrievedAt: string,
  sourceUrl = LIFE_SE_PRODUCTS_URL
): LifeSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|enable javascript/i.test(text) && !/Life/i.test(text)) {
    throw new Error('Life SE source returned a blocked page.');
  }
  if (!/Life\s+(?:är|ar)\s+nordens\s+ledande\s+h[aä]lsokedja/i.test(text) && !/Life/i.test(text)) {
    throw new Error('Life SE health-chain evidence missing from source.');
  }

  const stores = parseLifeSeStores(html);
  if (stores.length < 3 && !/cirka\s+130\s+butiker/i.test(text)) {
    throw new Error('Life SE connector requires national-chain store evidence.');
  }

  const observedProductCount = productCount(html);
  if (observedProductCount <= 0) throw new Error('Life SE product-category total missing from source.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedLifeSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Life SE source had no health-food assortment categories.');

  return categories.map((category) => ({
    country: 'SE',
    currency: 'SEK',
    chain: 'life-se',
    retailerType: 'health_food',
    code: `life-se:${category.category}`,
    name: category.name,
    category: category.category,
    price: null,
    priceText: '',
    available: true,
    productUrl: new URL(category.path, LIFE_SE_BASE_URL).toString(),
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'life_official_public_pages',
      parserVersion: LIFE_SE_PARSER_VERSION,
      observedStoreCount: stores.length,
      observedProductCount,
      evidenceText: category.evidenceText
    }
  }));
}

export function parseLifeSeStores(html: string, sourceUrl = LIFE_SE_STORES_URL): LifeSeStore[] {
  const state = extractLifeSeApolloState(html);
  const stores: LifeSeStore[] = [];
  for (const [key, value] of Object.entries(state)) {
    if (!key.startsWith('Store:') || !isRecord(value)) continue;
    const id = text(value.id) || key.replace('Store:', '');
    const name = text(value.name);
    const city = text(value.city);
    if (!id || !name || !city) continue;
    stores.push({
      country: 'SE',
      chain: 'life-se',
      retailerType: 'health_food',
      storeId: id,
      name,
      city,
      address: firstAddress(value),
      phone: phoneFrom(text(value.contact)),
      productUrl: new URL(`/butiker/${slugify(name)}`, LIFE_SE_BASE_URL).toString(),
      latitude: finiteNumber((value.coordinates as Record<string, unknown> | undefined)?.latitude),
      longitude: finiteNumber((value.coordinates as Record<string, unknown> | undefined)?.longitude),
      sourceUrl
    });
  }
  return stores.sort((a, b) => Number(a.storeId) - Number(b.storeId));
}

export function verifyLifeSeChainStatus(): LifeSeChainStatus {
  return LIFE_SE_CHAIN_STATUS;
}

export function isWhitelistedLifeSeCategory(value: string): value is LifeSeCategory {
  return (LIFE_SE_CATEGORY_WHITELIST as readonly string[]).includes(value);
}

async function fetchLifeSeHtml(fetchImpl: typeof fetch, sourceUrl: string): Promise<string> {
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 life-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Life SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Life SE source failed with HTTP ${response.status}.`);
  return response.text();
}

function productCount(html: string): number {
  const state = extractLifeSeApolloState(html);
  let highest = 0;
  for (const value of Object.values(state)) {
    if (!isRecord(value)) continue;
    for (const [key, nested] of Object.entries(value)) {
      if (!key.startsWith('products(') || !isRecord(nested)) continue;
      const total = finiteNumber(nested.totalResults);
      if (total !== null && total > highest) highest = total;
    }
  }
  return highest;
}

function extractLifeSeApolloState(html: string): Record<string, unknown> {
  const compactStart = 'window.__APOLLO_STATE__=JSON.parse("';
  const states: Array<Record<string, unknown>> = [];
  let searchFrom = 0;
  while (true) {
    const start = html.indexOf(compactStart, searchFrom);
    if (start < 0) break;
    const contentStart = start + compactStart.length;
    const endMarkers = [
      '");\n  /*-->*/</script><script>window.__GEOIP_COUNTRY__',
      '");</script><script>window.__GEOIP_COUNTRY__',
      '");</script>'
    ];
    const end = endMarkers
      .map((marker) => html.indexOf(marker, contentStart))
      .filter((index) => index >= 0)
      .sort((a, b) => a - b)[0];
    if (end === undefined) break;
    const parsed = parseEscapedApolloState(html.slice(contentStart, end));
    if (parsed) states.push(parsed);
    searchFrom = end + 3;
  }

  if (states.length > 0) return Object.assign({}, ...states);

  const match = html.match(/window\.__APOLLO_STATE__\s*=\s*JSON\.parse\("([\s\S]*?)"\);/);
  const parsed = match ? parseEscapedApolloState(match[1]) : null;
  return parsed ?? {};
}

function parseEscapedApolloState(escapedJson: string): Record<string, unknown> | null {
  try {
    const json = JSON.parse(`"${escapedJson}"`);
    const parsed = JSON.parse(json);
    return isRecord(parsed) ? parsed : null;
  } catch (error) {
    throw new Error(`Life SE Apollo state could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function firstAddress(record: Record<string, unknown>): string {
  const contactAddress = text(record.contact).match(/Adress:\s*([^<]+)/i)?.[1] ?? '';
  return contactAddress ? decodeHtmlText(contactAddress) : decodeHtmlText(text(record.address1));
}

function phoneFrom(contactHtml: string): string {
  return decodeHtmlText(contactHtml).match(/Telefon:\s*([0-9 -]+)/i)?.[1]?.trim() ?? '';
}

function finiteNumber(value: unknown): number | null {
  const number = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(number) ? number : null;
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/\p{Diacritic}/gu, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
