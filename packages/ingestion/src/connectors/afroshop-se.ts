export const AFROSHOP_SE_AFROSHOP_URL = 'https://afroshop.se/';
export const AFROSHOP_SE_AFRICAN_CENTRE_URL = 'https://africancentresweden.com/';
export const AFROSHOP_SE_PARSER_VERSION = 'afroshop-se-african-centre-v1';

export const AFROSHOP_SE_CATEGORY_WHITELIST = [
  'grains_flours',
  'legumes',
  'spices_sauces',
  'frozen_meat_fish',
  'beverages'
] as const;

export type AfroshopSeCategory = typeof AFROSHOP_SE_CATEGORY_WHITELIST[number];

export type AfroshopSeStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  country: 'SE';
  sourceUrl: string;
};

export type AfroshopSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'afroshop';
  operatorName: 'AfroShop / African Centre Sweden';
  retailer_type: 'ethnic_african';
  code: string;
  name: string;
  category: AfroshopSeCategory;
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
    source: 'afroshop_african_centre_public_pages';
    parserVersion: string;
    evidenceText: string;
  };
};

export type AfroshopSeChainStatus = {
  chain: 'afroshop';
  operatorName: 'AfroShop / African Centre Sweden';
  country: 'SE';
  retailer_type: 'ethnic_african';
  status: 'verified_multi_location_specialty';
  qualifiesForChainConnector: true;
  storeCount: number;
  evidence: Array<{
    kind: 'official_site' | 'directory_listing';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchAfroshopSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: AfroshopSeCategory; name: string; pattern: RegExp }> = [
  { category: 'grains_flours', name: 'African grains and flours assortment', pattern: /(?:garri|gari|fufu|yam flour|plantain flour|cassava|semolina)/i },
  { category: 'legumes', name: 'African beans and legumes assortment', pattern: /(?:black[-\s]?eyed beans|brown beans|cowpeas|beans|lentils)/i },
  { category: 'spices_sauces', name: 'African spices, soup bases, and sauces assortment', pattern: /(?:palm oil|egusi|ogbono|suya|pepper soup|jollof|shito|spices?|sauces?)/i },
  { category: 'frozen_meat_fish', name: 'African frozen meat and fish assortment', pattern: /(?:stockfish|dried fish|smoked fish|goat meat|cow foot|tripe|frozen fish|frozen meat)/i },
  { category: 'beverages', name: 'African beverages assortment', pattern: /(?:malt drink|ginger beer|zobo|sobolo|beverages?|drinks?)/i }
];

export const AFROSHOP_SE_CHAIN_STATUS: AfroshopSeChainStatus = {
  chain: 'afroshop',
  operatorName: 'AfroShop / African Centre Sweden',
  country: 'SE',
  retailer_type: 'ethnic_african',
  status: 'verified_multi_location_specialty',
  qualifiesForChainConnector: true,
  storeCount: 2,
  evidence: [
    {
      kind: 'official_site',
      label: 'AfroShop Sweden source exposes African grocery assortment terms such as garri, fufu, palm oil, and beans.',
      sourceUrl: AFROSHOP_SE_AFROSHOP_URL
    },
    {
      kind: 'official_site',
      label: 'African Centre Sweden source provides a second Swedish African-specialty grocery location signal.',
      sourceUrl: AFROSHOP_SE_AFRICAN_CENTRE_URL
    }
  ],
  caveat: 'AfroShop and African Centre are treated as the source-backed Swedish ethnic_african coverage group for grocery-overlap assortment rows; non-food beauty, hair, textile, and money-transfer services are excluded by the whitelist.'
};

export async function fetchAfroshopSeAssortment(options: FetchAfroshopSeAssortmentOptions = {}): Promise<AfroshopSeAssortmentRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: AfroshopSeAssortmentRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? [AFROSHOP_SE_AFROSHOP_URL, AFROSHOP_SE_AFRICAN_CENTRE_URL]) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 afroshop-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`AfroShop SE source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`AfroShop SE source failed with HTTP ${response.status}.`);

    for (const row of parseAfroshopSeAssortment(await response.text(), retrievedAt, sourceUrl)) {
      if (seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  if (new Set(rows.map((row) => row.storeId)).size < 2) throw new Error('AfroShop SE connector requires at least two verified Swedish African specialty locations.');
  return rows;
}

export function parseAfroshopSeAssortment(html: string, retrievedAt: string, sourceUrl = AFROSHOP_SE_AFROSHOP_URL): AfroshopSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in|cloudflare/i.test(text)) throw new Error('AfroShop SE source returned a blocked/login page.');

  const stores = parseAfroshopSeStores(html, sourceUrl);
  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedAfroshopSeCategory(entry.category));

  if (categories.length === 0) throw new Error('AfroShop SE source had no grocery-overlap African assortment categories.');

  const rows: AfroshopSeAssortmentRow[] = [];
  for (const store of stores) {
    for (const category of categories) {
      rows.push({
        country: 'SE',
        currency: 'SEK',
        chain: 'afroshop',
        operatorName: 'AfroShop / African Centre Sweden',
        retailer_type: 'ethnic_african',
        code: `afroshop:${store.storeId}:${category.category}`,
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
          source: 'afroshop_african_centre_public_pages',
          parserVersion: AFROSHOP_SE_PARSER_VERSION,
          evidenceText: category.evidenceText
        }
      });
    }
  }
  return rows;
}

export function parseAfroshopSeStores(html: string, sourceUrl = AFROSHOP_SE_AFROSHOP_URL): AfroshopSeStore[] {
  const text = decodeHtmlText(html);
  const definitions = [
    { storeId: 'stockholm-afroshop', name: 'AfroShop Stockholm', city: 'Stockholm', pattern: /Afro\s*Shop[^.]{0,80}(?:Stockholm|Skarpn[aä]ck|Rinkeby|Kista)[^.]{0,120}/i, address: /(?:[A-ZÅÄÖ][\wÅÄÖåäöéÉ\s-]+(?:gatan|vägen|torget|plan)\s+\d+[A-Z]?(?:,\s*\d{3}\s*\d{2}\s*Stockholm)?)/i },
    { storeId: 'african-centre-sweden', name: 'African Centre Sweden', city: 'Göteborg', pattern: /African\s+Centre\s+Sweden[^.]{0,120}(?:G[oö]teborg|Gothenburg|Malm[oö]|Stockholm)/i, address: /(?:[A-ZÅÄÖ][\wÅÄÖåäöéÉ\s-]+(?:gatan|vägen|torget|plan)\s+\d+[A-Z]?(?:,\s*\d{3}\s*\d{2}\s*(?:G[oö]teborg|Malm[oö]|Stockholm))?)/i }
  ];

  return definitions.flatMap((definition) => {
    if (!definition.pattern.test(text)) return [];
    const address = text.match(definition.address)?.[0]?.replace(/\s+/g, ' ').trim() ?? `${definition.city} public listing`;
    return [{
      storeId: definition.storeId,
      name: definition.name,
      address,
      city: definition.city,
      country: 'SE' as const,
      sourceUrl
    }];
  });
}

export function isWhitelistedAfroshopSeCategory(category: string): category is AfroshopSeCategory {
  return (AFROSHOP_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyAfroshopSeChainStatus(): AfroshopSeChainStatus {
  return AFROSHOP_SE_CHAIN_STATUS;
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
