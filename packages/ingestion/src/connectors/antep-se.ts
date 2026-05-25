export const ANTEP_SE_SOURCE_URL = 'https://www.antepmarket.se/';
export const ANTEP_SE_PARSER_VERSION = 'antep-se-v1';

export const ANTEP_SE_CATEGORY_WHITELIST = ['bakery', 'produce', 'meat_deli', 'pantry'] as const;
export type AntepSeCategory = typeof ANTEP_SE_CATEGORY_WHITELIST[number];

export type AntepSeStore = {
  storeId: string;
  name: string;
  city: string;
  address: string;
  country: 'SE';
  sourceUrl: string;
};

export type AntepSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'antep';
  operatorName: 'Antep Market';
  retailer_type: 'ethnic_middle_eastern';
  code: string;
  name: string;
  category: AntepSeCategory;
  price: null;
  priceText: '';
  available: true;
  storeId: string;
  storeName: string;
  city: string;
  address: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: { source: 'antep_market_site'; parserVersion: string; evidenceText: string };
};

export type AntepSeChainStatus = {
  chain: 'antep';
  operatorName: 'Antep Market';
  country: 'SE';
  retailer_type: 'ethnic_middle_eastern';
  status: 'verified_multi_store_chain';
  qualifiesForChainConnector: true;
  skippedSingleShopNames: readonly string[];
  storeCount: number;
  caveat: string;
};

const CATEGORY_EVIDENCE: Array<{ category: AntepSeCategory; name: string; pattern: RegExp }> = [
  { category: 'bakery', name: 'Middle Eastern bread and bakery assortment', pattern: /(?:pide|lavash|br[oö]d|baklava|bakverk)/i },
  { category: 'produce', name: 'Fresh fruit and vegetable assortment', pattern: /(?:frukt|gr[oö]nt|gr[oö]nsaker|oliver|färska örter)/i },
  { category: 'meat_deli', name: 'Halal meat and deli assortment', pattern: /(?:halal|k[oö]tt|chark|sucuk|lamm)/i },
  { category: 'pantry', name: 'Middle Eastern pantry assortment', pattern: /(?:bulgur|ris|kryddor|tahini|linser|b[oö]nor)/i }
];

export const ANTEP_SE_CHAIN_STATUS: AntepSeChainStatus = {
  chain: 'antep',
  operatorName: 'Antep Market',
  country: 'SE',
  retailer_type: 'ethnic_middle_eastern',
  status: 'verified_multi_store_chain',
  qualifiesForChainConnector: true,
  skippedSingleShopNames: ['Yara Market', 'independent neighborhood Middle Eastern markets'],
  storeCount: 2,
  caveat: 'This connector only emits the source-backed multi-store Antep Market operation. Similar one-off Turkish, Lebanese, or Syrian neighborhood shops are intentionally skipped until they have multi-store evidence.'
};

export type FetchAntepSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export async function fetchAntepSeAssortment(options: FetchAntepSeAssortmentOptions = {}): Promise<AntepSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? ANTEP_SE_SOURCE_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 antep-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Antep SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Antep SE source failed with HTTP ${response.status}.`);
  const rows = parseAntepSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseAntepSeAssortment(html: string, retrievedAt: string, sourceUrl = ANTEP_SE_SOURCE_URL): AntepSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Antep SE source returned a blocked/login page.');
  if (!/Antep\s+Market/i.test(text)) throw new Error('Antep Market chain evidence missing from source.');

  const stores = parseAntepSeStores(html, sourceUrl);
  if (stores.length < 2) throw new Error('Antep SE connector requires at least two verified Antep Market stores.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedAntepSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Antep SE source had no grocery-overlap categories.');

  return stores.flatMap((store) => categories.map((category) => ({
    country: 'SE' as const,
    currency: 'SEK' as const,
    chain: 'antep' as const,
    operatorName: 'Antep Market' as const,
    retailer_type: 'ethnic_middle_eastern' as const,
    code: `antep:${store.storeId}:${category.category}`,
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
    provenance: { source: 'antep_market_site' as const, parserVersion: ANTEP_SE_PARSER_VERSION, evidenceText: category.evidenceText }
  })));
}

export function parseAntepSeStores(html: string, sourceUrl = ANTEP_SE_SOURCE_URL): AntepSeStore[] {
  const text = decodeHtmlText(html);
  const storeDefinitions = [
    { storeId: 'rinkeby', name: 'Antep Market Rinkeby', heading: /Rinkeby/i, address: /Rinkebystr[åa]ket\s+\d+[^,]*(?:,\s*)?\d{3}\s*\d{2}\s*(?:Sp[åa]nga|Rinkeby)/i, city: 'Stockholm' },
    { storeId: 'fittja', name: 'Antep Market Fittja', heading: /Fittja/i, address: /Fittjav[äa]gen\s+\d+[^,]*(?:,\s*)?\d{3}\s*\d{2}\s*(?:Norsborg|Fittja)/i, city: 'Botkyrka' },
    { storeId: 'malmo', name: 'Antep Market Malmö', heading: /Malm[öo]/i, address: /(?:Malm[öo]|Roseng[åa]rd)[^<]{0,80}\d{3}\s*\d{2}\s*Malm[öo]/i, city: 'Malmö' }
  ];

  return storeDefinitions.flatMap((store) => {
    const address = text.match(store.address)?.[0]?.replace(/\s+/g, ' ').trim() ?? '';
    if (!store.heading.test(text) || !address) return [];
    return [{ storeId: store.storeId, name: store.name, city: store.city, address, country: 'SE' as const, sourceUrl }];
  });
}

export function isWhitelistedAntepSeCategory(category: string): category is AntepSeCategory {
  return (ANTEP_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyAntepSeChainStatus(): AntepSeChainStatus {
  return ANTEP_SE_CHAIN_STATUS;
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
