export const POLSKI_SKLEP_SE_POLMARKET_URL = 'https://www.polmarket.se/';
export const POLSKI_SKLEP_SE_DIRECTORY_URL = 'https://www.polskiewszwecji.com/katalog-firm/polski-sklep';
export const POLSKI_SKLEP_SE_PARSER_VERSION = 'polski-sklep-se-polmarket-v1';

export const POLSKI_SKLEP_SE_CATEGORY_WHITELIST = [
  'bakery',
  'meat_deli',
  'dairy',
  'pantry'
] as const;

export type PolskiSklepSeCategory = typeof POLSKI_SKLEP_SE_CATEGORY_WHITELIST[number];

export type PolskiSklepSeStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  country: 'SE';
  sourceUrl: string;
};

export type PolskiSklepSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'polski-sklep';
  operatorName: 'Polmarket';
  retailer_type: 'ethnic_polish_eastern_european';
  code: string;
  name: string;
  category: PolskiSklepSeCategory;
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
    source: 'polmarket_official_site';
    parserVersion: string;
    evidenceText: string;
  };
};

export type PolskiSklepSeChainStatus = {
  chain: 'polski-sklep';
  operatorName: 'Polmarket';
  country: 'SE';
  retailer_type: 'ethnic_polish_eastern_european';
  status: 'verified_three_store_chain';
  qualifiesForChainConnector: true;
  storeCount: number;
  evidence: Array<{
    kind: 'official_site' | 'directory_listing';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchPolskiSklepSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: PolskiSklepSeCategory; name: string; pattern: RegExp }> = [
  { category: 'bakery', name: 'Polish bread and bakery assortment', pattern: /br[oö]d[^.]*munkar[^.]*bullar[^.]*bakelse/i },
  { category: 'meat_deli', name: 'Polish charcuterie and deli assortment', pattern: /charkdisk[^.]*korvar[^.]*skinkor[^.]*charkuterier/i },
  { category: 'dairy', name: 'Polish cheese and dairy assortment', pattern: /charkdisk[^.]*ostar/i },
  { category: 'pantry', name: 'Polish pantry assortment', pattern: /(?:5000|5\s*000)[^.]*polska artiklar|varor som ni k[aä]nner igen/i }
];

export const POLSKI_SKLEP_SE_CHAIN_STATUS: PolskiSklepSeChainStatus = {
  chain: 'polski-sklep',
  operatorName: 'Polmarket',
  country: 'SE',
  retailer_type: 'ethnic_polish_eastern_european',
  status: 'verified_three_store_chain',
  qualifiesForChainConnector: true,
  storeCount: 3,
  evidence: [
    {
      kind: 'official_site',
      label: 'Polmarket official site calls itself a store chain and lists Vällingby, Huvudsta Centrum, and Hallunda Centrum stores.',
      sourceUrl: POLSKI_SKLEP_SE_POLMARKET_URL
    },
    {
      kind: 'directory_listing',
      label: 'Polskie w Szwecji describes Polmarket as a Polish grocery chain founded in 2012, with second and third stores opened in 2018 and 2019.',
      sourceUrl: POLSKI_SKLEP_SE_DIRECTORY_URL
    }
  ],
  caveat: '“Polski sklep” is a generic Polish-store phrase in Sweden, so this connector targets the verified Polmarket chain rather than merging independent Polish delis under one invented operator.'
};

export async function fetchPolskiSklepSeAssortment(options: FetchPolskiSklepSeAssortmentOptions = {}): Promise<PolskiSklepSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? POLSKI_SKLEP_SE_POLMARKET_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 polski-sklep-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Polski Sklep SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Polski Sklep SE source failed with HTTP ${response.status}.`);
  const rows = parsePolskiSklepSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parsePolskiSklepSeAssortment(
  html: string,
  retrievedAt: string,
  sourceUrl = POLSKI_SKLEP_SE_POLMARKET_URL
): PolskiSklepSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in/i.test(text)) throw new Error('Polski Sklep SE source returned a blocked/login page.');
  if (!/butikskedjan\s+Polmarket/i.test(text)) throw new Error('Polmarket chain heading missing from Polski Sklep SE source.');

  const stores = parsePolskiSklepSeStores(html, sourceUrl);
  if (stores.length < 3) throw new Error('Polski Sklep SE connector requires at least three verified Polmarket stores.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedPolskiSklepSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Polski Sklep SE source had no grocery-overlap categories.');

  const rows: PolskiSklepSeAssortmentRow[] = [];
  for (const store of stores) {
    for (const category of categories) {
      rows.push({
        country: 'SE',
        currency: 'SEK',
        chain: 'polski-sklep',
        operatorName: 'Polmarket',
        retailer_type: 'ethnic_polish_eastern_european',
        code: `polski-sklep:${store.storeId}:${category.category}`,
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
          source: 'polmarket_official_site',
          parserVersion: POLSKI_SKLEP_SE_PARSER_VERSION,
          evidenceText: category.evidenceText
        }
      });
    }
  }
  return rows;
}

export function parsePolskiSklepSeStores(html: string, sourceUrl = POLSKI_SKLEP_SE_POLMARKET_URL): PolskiSklepSeStore[] {
  const text = decodeHtmlText(html);
  const storeDefinitions = [
    { storeId: 'vallingby', name: 'Polmarket Vällingby', heading: /V[aä]llingby/i, address: /Grimstagatan\s+53,\s*162\s*57\s*V[aä]llingby/i, city: 'Vällingby' },
    { storeId: 'huvudsta', name: 'Polmarket Huvudsta Centrum', heading: /Huvudsta\s+Centrum/i, address: /Storgatan\s+70\s*A-C,\s*171\s*52\s*Solna/i, city: 'Solna' },
    { storeId: 'hallunda', name: 'Polmarket Hallunda Centrum', heading: /Hallunda\s+Centrum/i, address: /Hallunda\s+torg,\s*145\s*68\s*Norsborg/i, city: 'Norsborg' }
  ];

  return storeDefinitions.flatMap((store) => {
    const address = text.match(store.address)?.[0]?.replace(/\s+/g, ' ').trim() ?? '';
    if (!store.heading.test(text) || !address) return [];
    return [{
      storeId: store.storeId,
      name: store.name,
      address,
      city: store.city,
      country: 'SE' as const,
      sourceUrl
    }];
  });
}

export function isWhitelistedPolskiSklepSeCategory(category: string): category is PolskiSklepSeCategory {
  return (POLSKI_SKLEP_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyPolskiSklepSeChainStatus(): PolskiSklepSeChainStatus {
  return POLSKI_SKLEP_SE_CHAIN_STATUS;
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
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
