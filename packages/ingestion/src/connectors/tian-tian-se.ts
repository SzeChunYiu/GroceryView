export const TIAN_TIAN_SE_OFFICIAL_URL = 'https://www.tiantian.se/';
export const TIAN_TIAN_SE_DIRECTORY_URL = 'https://www.asianexpress.se/';
export const TIAN_TIAN_SE_PARSER_VERSION = 'tian-tian-se-v1';

export const TIAN_TIAN_SE_CATEGORY_WHITELIST = [
  'rice_noodles',
  'sauces_condiments',
  'frozen',
  'pantry',
  'snacks',
  'beverages'
] as const;

export type TianTianSeCategory = typeof TIAN_TIAN_SE_CATEGORY_WHITELIST[number];

export type TianTianSeAssortmentRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'tian-tian';
  operatorName: 'Tian Tian / Asian Express';
  retailer_type: 'ethnic_asian';
  code: string;
  name: string;
  category: TianTianSeCategory;
  price: null;
  priceText: '';
  available: true;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'tian_tian_official_site';
    parserVersion: string;
    evidenceText: string;
  };
};

export type TianTianSeChainStatus = {
  chain: 'tian-tian';
  operatorName: 'Tian Tian / Asian Express';
  country: 'SE';
  retailer_type: 'ethnic_asian';
  status: 'verified_asian_grocery_operator';
  qualifiesForChainConnector: true;
  evidence: Array<{
    kind: 'official_site' | 'brand_site';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchTianTianSeAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const CATEGORY_EVIDENCE: Array<{ category: TianTianSeCategory; name: string; pattern: RegExp }> = [
  { category: 'rice_noodles', name: 'Asian rice and noodle assortment', pattern: /ris|rice|nudlar|noodles/i },
  { category: 'sauces_condiments', name: 'Asian sauces and condiments assortment', pattern: /soja|soy|s[åa]s|sauce|condiment/i },
  { category: 'frozen', name: 'Asian frozen dumplings and meal assortment', pattern: /fryst|frozen|dumplings|gyoza/i },
  { category: 'pantry', name: 'Asian pantry and spice assortment', pattern: /asiatiska\s+varor|asian\s+groceries|pantry|krydd/i },
  { category: 'snacks', name: 'Asian snacks and confectionery assortment', pattern: /snacks|chips|godis|kakor/i },
  { category: 'beverages', name: 'Asian drinks and tea assortment', pattern: /dryck|beverage|tea|bubble\s*tea/i }
];

export const TIAN_TIAN_SE_CHAIN_STATUS: TianTianSeChainStatus = {
  chain: 'tian-tian',
  operatorName: 'Tian Tian / Asian Express',
  country: 'SE',
  retailer_type: 'ethnic_asian',
  status: 'verified_asian_grocery_operator',
  qualifiesForChainConnector: true,
  evidence: [
    {
      kind: 'official_site',
      label: 'Tian Tian official storefront identifies the Swedish Asian grocery operator and its grocery assortment.',
      sourceUrl: TIAN_TIAN_SE_OFFICIAL_URL
    },
    {
      kind: 'brand_site',
      label: 'Asian Express branding is treated as the same Tian Tian operator for this connector.',
      sourceUrl: TIAN_TIAN_SE_DIRECTORY_URL
    }
  ],
  caveat: 'This connector only emits source-backed grocery-overlap categories from the Tian Tian / Asian Express source; it does not invent SKU-level prices or include non-grocery Asian retail categories.'
};

export async function fetchTianTianSeAssortment(options: FetchTianTianSeAssortmentOptions = {}): Promise<TianTianSeAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? TIAN_TIAN_SE_OFFICIAL_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 tian-tian-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Tian Tian SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Tian Tian SE source failed with HTTP ${response.status}.`);
  const rows = parseTianTianSeAssortment(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseTianTianSeAssortment(
  html: string,
  retrievedAt: string,
  sourceUrl = TIAN_TIAN_SE_OFFICIAL_URL
): TianTianSeAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logga in|login required/i.test(text)) throw new Error('Tian Tian SE source returned a blocked/login page.');
  if (!/tian\s*tian|asian\s*express/i.test(text)) throw new Error('Tian Tian / Asian Express chain evidence missing from SE source.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedTianTianSeCategory(entry.category));
  if (categories.length === 0) throw new Error('Tian Tian SE source had no grocery-overlap categories.');

  return categories.map((category) => ({
    country: 'SE',
    currency: 'SEK',
    chain: 'tian-tian',
    operatorName: 'Tian Tian / Asian Express',
    retailer_type: 'ethnic_asian',
    code: `tian-tian:${category.category}`,
    name: category.name,
    category: category.category,
    price: null,
    priceText: '',
    available: true,
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'tian_tian_official_site',
      parserVersion: TIAN_TIAN_SE_PARSER_VERSION,
      evidenceText: category.evidenceText
    }
  }));
}

export function isWhitelistedTianTianSeCategory(category: string): category is TianTianSeCategory {
  return (TIAN_TIAN_SE_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyTianTianSeChainStatus(): TianTianSeChainStatus {
  return TIAN_TIAN_SE_CHAIN_STATUS;
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
