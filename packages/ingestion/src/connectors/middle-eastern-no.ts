export const MIDDLE_EASTERN_NO_IMS_CITYCON_URL = 'https://www.citycon.com/no/newsroom/internasjonal-matsenter-ims-med-ostlandssatsing-pa-torget-vest-2020';
export const MIDDLE_EASTERN_NO_IMS_KILDEN_URL = 'https://www.kilden.no/store/ims-internasjonalt-matsenter-as/';
export const MIDDLE_EASTERN_NO_PARSER_VERSION = 'middle-eastern-no-ims-v1';

export const MIDDLE_EASTERN_NO_SOURCE_URLS = [
  MIDDLE_EASTERN_NO_IMS_CITYCON_URL,
  MIDDLE_EASTERN_NO_IMS_KILDEN_URL
] as const;

export const MIDDLE_EASTERN_NO_CATEGORY_WHITELIST = [
  'produce',
  'halal_meat',
  'bakery_naan',
  'spices_pantry',
  'international_grocery'
] as const;

export type MiddleEasternNoCategory = typeof MIDDLE_EASTERN_NO_CATEGORY_WHITELIST[number];

export type MiddleEasternNoStore = {
  storeId: string;
  name: string;
  city: string;
  address: string;
  country: 'NO';
  sourceUrl: string;
  evidenceText: string;
};

export type MiddleEasternNoAssortmentRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'ims-no';
  operatorName: 'Internasjonal Matsenter (IMS)';
  retailer_type: 'ethnic_middle_eastern';
  code: string;
  name: string;
  category: MiddleEasternNoCategory;
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
    source: 'ims_public_pages';
    parserVersion: string;
    evidenceText: string;
    sourceUrls: string[];
  };
};

export type MiddleEasternNoChainStatus = {
  chain: 'ims-no';
  operatorName: 'Internasjonal Matsenter (IMS)';
  country: 'NO';
  retailer_type: 'ethnic_middle_eastern';
  status: 'verified_multi_location_halal_international_market';
  qualifiesForChainConnector: true;
  qualifiesForLocationConnector: true;
  qualifiesForOnlinePriceConnector: false;
  minimumVerifiedStoreCount: number;
  evidence: Array<{
    kind: 'shopping_centre_press_release' | 'shopping_centre_store_page';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchMiddleEasternNoAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

type CategoryEvidence = {
  category: MiddleEasternNoCategory;
  name: string;
  pattern: RegExp;
};

const CATEGORY_EVIDENCE: CategoryEvidence[] = [
  {
    category: 'produce',
    name: 'Fresh fruit and exotic vegetables',
    pattern: /fersk(?:e)?\s+frukt[^.]*fersk(?:e)?\s+gr[oø]nnsaker|fersk(?:e)?\s+og\s+exotiske\s+gr[oø]nnsaker/i
  },
  {
    category: 'halal_meat',
    name: 'Fresh halal meat counter',
    pattern: /halal\s+(?:ferskt?\s+)?kj[oø]tt|fersk\s+halal\s+kj[oø]tt/i
  },
  {
    category: 'bakery_naan',
    name: 'In-store bakery and fresh naan bread',
    pattern: /bakeri[^.]*naanbr[oø]d|naanbr[oø]d[^.]*butikkbakeri/i
  },
  {
    category: 'spices_pantry',
    name: 'Spices and pantry groceries',
    pattern: /krydder[^.]*dagligvarer|dagligvarer[^.]*krydder/i
  },
  {
    category: 'international_grocery',
    name: 'International grocery assortment',
    pattern: /matvarer\s+fra\s+hele\s+verden|internasjonal(?:e)?\s+dagligvare/i
  }
];

export const MIDDLE_EASTERN_NO_CHAIN_STATUS: MiddleEasternNoChainStatus = {
  chain: 'ims-no',
  operatorName: 'Internasjonal Matsenter (IMS)',
  country: 'NO',
  retailer_type: 'ethnic_middle_eastern',
  status: 'verified_multi_location_halal_international_market',
  qualifiesForChainConnector: true,
  qualifiesForLocationConnector: true,
  qualifiesForOnlinePriceConnector: false,
  minimumVerifiedStoreCount: 3,
  evidence: [
    {
      kind: 'shopping_centre_press_release',
      label: 'Citycon says IMS is known for exotic groceries, fresh halal meat, and naan bakery, with first stores in Stavanger and Sandnes before expanding to Torget Vest in Drammen.',
      sourceUrl: MIDDLE_EASTERN_NO_IMS_CITYCON_URL
    },
    {
      kind: 'shopping_centre_store_page',
      label: 'Kilden lists the IMS Hillevåg grocery store at Gartnerveien 25 and repeats the world-food, halal meat, exotic vegetables, and bakery assortment.',
      sourceUrl: MIDDLE_EASTERN_NO_IMS_KILDEN_URL
    }
  ],
  caveat: 'IMS is positioned by public sources as an international/halal grocery mini-chain, not a pure Middle Eastern-only operator; this connector includes it because the assortment overlaps the ethnic_middle_eastern segment and no independent single-city shops are merged into an invented chain. Public sources do not expose item prices, so the connector emits null-price assortment coverage only.'
};

export async function fetchMiddleEasternNoAssortment(
  options: FetchMiddleEasternNoAssortmentOptions = {}
): Promise<MiddleEasternNoAssortmentRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = [...(options.sourceUrls ?? MIDDLE_EASTERN_NO_SOURCE_URLS)];
  const htmlParts: string[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 middle-eastern-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Middle Eastern NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Middle Eastern NO source failed with HTTP ${response.status}.`);
    htmlParts.push(`<!-- source:${sourceUrl} -->\n${await response.text()}`);
  }

  const rows = parseMiddleEasternNoAssortment(
    htmlParts.join('\n'),
    options.retrievedAt ?? new Date().toISOString(),
    sourceUrls
  );
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseMiddleEasternNoAssortment(
  html: string,
  retrievedAt: string,
  sourceUrls: readonly string[] = MIDDLE_EASTERN_NO_SOURCE_URLS
): MiddleEasternNoAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|logg inn|logga in/i.test(text)) {
    throw new Error('Middle Eastern NO source returned a blocked/login page.');
  }
  if (!/Internasjonal\s+Matsenter|Internasjonal\s+matsenter|IMS\b/i.test(text)) {
    throw new Error('IMS market evidence missing from Middle Eastern NO source.');
  }

  const stores = parseMiddleEasternNoStores(html, sourceUrls[0] ?? MIDDLE_EASTERN_NO_IMS_CITYCON_URL);
  if (stores.length < 3) throw new Error('Middle Eastern NO connector requires at least three verified IMS store locations.');

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedMiddleEasternNoCategory(entry.category));
  if (categories.length === 0) throw new Error('Middle Eastern NO source had no grocery-overlap assortment categories.');

  const rows: MiddleEasternNoAssortmentRow[] = [];
  const provenanceSourceUrls = [...sourceUrls];
  for (const store of stores) {
    for (const category of categories) {
      rows.push({
        country: 'NO',
        currency: 'NOK',
        chain: 'ims-no',
        operatorName: 'Internasjonal Matsenter (IMS)',
        retailer_type: 'ethnic_middle_eastern',
        code: `ims-no:${store.storeId}:${category.category}`,
        name: category.name,
        category: category.category,
        price: null,
        priceText: '',
        available: true,
        storeId: store.storeId,
        storeName: store.name,
        city: store.city,
        address: store.address,
        sourceUrl: store.sourceUrl,
        retrievedAt,
        provenance: {
          source: 'ims_public_pages',
          parserVersion: MIDDLE_EASTERN_NO_PARSER_VERSION,
          evidenceText: category.evidenceText,
          sourceUrls: provenanceSourceUrls
        }
      });
    }
  }
  return rows;
}

export function parseMiddleEasternNoStores(
  html: string,
  sourceUrl = MIDDLE_EASTERN_NO_IMS_CITYCON_URL
): MiddleEasternNoStore[] {
  const text = decodeHtmlText(html);
  const stores: MiddleEasternNoStore[] = [];

  const hillevagAddress = text.match(/Gartnerveien\s+25/i)?.[0] ?? '';
  if (/HILLVE[AÅ]G|Hillev[aå]g|Stavanger/i.test(text) && hillevagAddress) {
    stores.push({
      storeId: 'hillevag',
      name: 'IMS Hillevåg',
      city: 'Stavanger',
      address: `${hillevagAddress}, 4016 Stavanger`,
      country: 'NO',
      sourceUrl: MIDDLE_EASTERN_NO_IMS_KILDEN_URL,
      evidenceText: sentenceContaining(text, /Gartnerveien\s+25/i)
    });
  } else if (/f[oø]rste\s+butikkene\s+i\s+Stavanger\s+og\s+Sandnes/i.test(text)) {
    stores.push({
      storeId: 'stavanger',
      name: 'IMS Stavanger',
      city: 'Stavanger',
      address: 'Stavanger',
      country: 'NO',
      sourceUrl,
      evidenceText: sentenceContaining(text, /Stavanger\s+og\s+Sandnes/i)
    });
  }

  if (/Sandnes/i.test(text)) {
    stores.push({
      storeId: 'sandnes',
      name: 'IMS Sandnes',
      city: 'Sandnes',
      address: text.match(/Oalsgata\s+1,\s*4307\s+Sandnes/i)?.[0] ?? 'Sandnes',
      country: 'NO',
      sourceUrl,
      evidenceText: sentenceContaining(text, /Sandnes/i)
    });
  }

  if (/Drammen|Torget\s+Vest/i.test(text)) {
    stores.push({
      storeId: 'drammen-torget-vest',
      name: 'IMS Drammen Torget Vest',
      city: 'Drammen',
      address: text.match(/R[aå]dhusgata\s+2,\s*3016\s+Drammen/i)?.[0] ?? 'Torget Vest, Drammen',
      country: 'NO',
      sourceUrl,
      evidenceText: sentenceContaining(text, /Drammen|Torget\s+Vest/i)
    });
  }

  const seen = new Set<string>();
  return stores.filter((store) => {
    if (seen.has(store.storeId)) return false;
    seen.add(store.storeId);
    return true;
  });
}

export function isWhitelistedMiddleEasternNoCategory(category: string): category is MiddleEasternNoCategory {
  return (MIDDLE_EASTERN_NO_CATEGORY_WHITELIST as readonly string[]).includes(category);
}

export function verifyMiddleEasternNoChainStatus(): MiddleEasternNoChainStatus {
  return MIDDLE_EASTERN_NO_CHAIN_STATUS;
}

function sentenceContaining(text: string, pattern: RegExp): string {
  const sentence = text.split(/(?<=[.!?])\s+/).find((part) => pattern.test(part));
  return sentence?.replace(/\s+/g, ' ').trim() ?? text.match(pattern)?.[0] ?? '';
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
