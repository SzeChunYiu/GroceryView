export const INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL = 'https://ndonline.no/om-oss/';
export const INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL = 'https://ndonline.no/';
export const INDIAN_SOUTH_ASIAN_NO_NORBYGATA_PRIVACY_URL = 'https://ndonline.no/personvern/';
export const INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL = 'https://www.norgebiz.com/norbygata-grocery-as-909-95-633';
export const INDIAN_SOUTH_ASIAN_NO_PARSER_VERSION = 'indian-south-asian-no-norbygata-v1';

export const INDIAN_SOUTH_ASIAN_NO_SOURCE_URLS = [
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_PRIVACY_URL,
  INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL
] as const;

export const INDIAN_SOUTH_ASIAN_NO_CATEGORY_WHITELIST = [
  'spices_masala',
  'rice_grains',
  'lentils_daal',
  'flour_atta',
  'oil_ghee',
  'sweets_snacks',
  'juice_beverages'
] as const;

export type IndianSouthAsianNoCategory = typeof INDIAN_SOUTH_ASIAN_NO_CATEGORY_WHITELIST[number];

export type IndianSouthAsianNoLocation = {
  storeId: string;
  name: string;
  city: 'Oslo';
  address: string;
  country: 'NO';
  channel: 'retail_store' | 'wholesale_online';
  sourceUrl: string;
  evidenceText: string;
};

export type IndianSouthAsianNoAssortmentRow = {
  country: 'NO';
  currency: 'NOK';
  chain: 'norbygata-no';
  operatorName: 'Norbygata Dagligvare / Norbygata Engros';
  retailer_type: 'ethnic_indian_south_asian';
  code: string;
  name: string;
  category: IndianSouthAsianNoCategory;
  price: null;
  priceText: '';
  available: true;
  storeId: string;
  storeName: string;
  city: 'Oslo';
  address: string;
  channel: 'retail_store' | 'wholesale_online';
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'norbygata_public_pages';
    parserVersion: string;
    evidenceText: string;
    sourceUrls: string[];
  };
};

export type IndianSouthAsianNoChainStatus = {
  chain: 'norbygata-no';
  operatorName: 'Norbygata Dagligvare / Norbygata Engros';
  country: 'NO';
  retailer_type: 'ethnic_indian_south_asian';
  status: 'verified_retail_wholesale_south_asian_operator';
  qualifiesForChainConnector: true;
  qualifiesForLocationConnector: true;
  qualifiesForOnlinePriceConnector: false;
  minimumVerifiedLocationCount: number;
  evidence: Array<{
    kind: 'official_site' | 'directory_listing';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchIndianSouthAsianNoAssortmentOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

type CategoryEvidence = {
  category: IndianSouthAsianNoCategory;
  name: string;
  pattern: RegExp;
};

const CATEGORY_EVIDENCE: CategoryEvidence[] = [
  {
    category: 'spices_masala',
    name: 'South Asian spices and masala mixes',
    pattern: /krydder|masala|shan|laziza|trs/i
  },
  {
    category: 'rice_grains',
    name: 'Rice and South Asian grains',
    pattern: /\bris\b|basmati|sona\s+masoori|ponni/i
  },
  {
    category: 'lentils_daal',
    name: 'Lentils, daal, peas and beans',
    pattern: /linser|daal|dhal|erter|b[oø]nner/i
  },
  {
    category: 'flour_atta',
    name: 'Atta, flour and semolina',
    pattern: /atta|semolina|mel\b|flour/i
  },
  {
    category: 'oil_ghee',
    name: 'Cooking oil and ghee',
    pattern: /ghee|olje/i
  },
  {
    category: 'sweets_snacks',
    name: 'South Asian sweets and snacks',
    pattern: /sweets|snacks|kjeks|kaker|jelly|chaat/i
  },
  {
    category: 'juice_beverages',
    name: 'Imported South Asian beverages',
    pattern: /juice|mango\s+\(pakistan\)|regal\s+nectar|drikke/i
  }
];

export const INDIAN_SOUTH_ASIAN_NO_CHAIN_STATUS: IndianSouthAsianNoChainStatus = {
  chain: 'norbygata-no',
  operatorName: 'Norbygata Dagligvare / Norbygata Engros',
  country: 'NO',
  retailer_type: 'ethnic_indian_south_asian',
  status: 'verified_retail_wholesale_south_asian_operator',
  qualifiesForChainConnector: true,
  qualifiesForLocationConnector: true,
  qualifiesForOnlinePriceConnector: false,
  minimumVerifiedLocationCount: 2,
  evidence: [
    {
      kind: 'official_site',
      label: 'Norbygata Engros official site says the business started as a grocery store and its assortment has mainly been within South Asian cuisine.',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_ABOUT_URL
    },
    {
      kind: 'official_site',
      label: 'Norbygata Engros official pages identify the Ulvenveien 102 Oslo wholesale/online operation and show South Asian grocery categories and brands.',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_HOME_URL
    },
    {
      kind: 'directory_listing',
      label: 'A business directory lists Norbygata Dagligvare at Toyengata 3 and describes Indian/Pakistani grocery specialization.',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL
    }
  ],
  caveat: 'Norbygata is modeled as a source-backed South Asian retail plus wholesale/online operator, not as a national consumer supermarket chain. Public catalog prices require login, so this connector emits null-price assortment coverage only.'
};

export async function fetchIndianSouthAsianNoAssortment(
  options: FetchIndianSouthAsianNoAssortmentOptions = {}
): Promise<IndianSouthAsianNoAssortmentRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrls = [...(options.sourceUrls ?? INDIAN_SOUTH_ASIAN_NO_SOURCE_URLS)];
  const htmlParts: string[] = [];

  for (const sourceUrl of sourceUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 indian-south-asian-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Indian South Asian NO source blocked with HTTP ${response.status}.`);
    }
    if (!response.ok) throw new Error(`Indian South Asian NO source failed with HTTP ${response.status}.`);
    htmlParts.push(`<!-- source:${sourceUrl} -->\n${await response.text()}`);
  }

  const rows = parseIndianSouthAsianNoAssortment(
    htmlParts.join('\n'),
    options.retrievedAt ?? new Date().toISOString(),
    sourceUrls
  );
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseIndianSouthAsianNoAssortment(
  html: string,
  retrievedAt: string,
  sourceUrls: readonly string[] = INDIAN_SOUTH_ASIAN_NO_SOURCE_URLS
): IndianSouthAsianNoAssortmentRow[] {
  const text = decodeHtmlText(html);
  if (/captcha|access denied|enable javascript|logg inn for pris/i.test(text) && !/Norbygata/i.test(text)) {
    throw new Error('Indian South Asian NO source returned a blocked/login page.');
  }
  if (!hasSouthAsianNorbygataEvidence(text)) {
    throw new Error('Norbygata South Asian grocery evidence missing from Indian South Asian NO source.');
  }

  const locations = parseIndianSouthAsianNoLocations(html);
  if (locations.length < 2) {
    throw new Error('Indian South Asian NO connector requires at least two verified Norbygata retail/wholesale locations.');
  }

  const categories = CATEGORY_EVIDENCE
    .map((entry) => ({ ...entry, evidenceText: text.match(entry.pattern)?.[0] ?? '' }))
    .filter((entry) => entry.evidenceText && isWhitelistedIndianSouthAsianNoCategory(entry.category));
  if (categories.length === 0) throw new Error('Indian South Asian NO source had no grocery-overlap assortment categories.');

  const rows: IndianSouthAsianNoAssortmentRow[] = [];
  const provenanceSourceUrls = [...sourceUrls];
  for (const location of locations) {
    for (const category of categories) {
      rows.push({
        country: 'NO',
        currency: 'NOK',
        chain: 'norbygata-no',
        operatorName: 'Norbygata Dagligvare / Norbygata Engros',
        retailer_type: 'ethnic_indian_south_asian',
        code: `norbygata-no:${location.storeId}:${category.category}`,
        name: category.name,
        category: category.category,
        price: null,
        priceText: '',
        available: true,
        storeId: location.storeId,
        storeName: location.name,
        city: location.city,
        address: location.address,
        channel: location.channel,
        sourceUrl: location.sourceUrl,
        retrievedAt,
        provenance: {
          source: 'norbygata_public_pages',
          parserVersion: INDIAN_SOUTH_ASIAN_NO_PARSER_VERSION,
          evidenceText: category.evidenceText,
          sourceUrls: provenanceSourceUrls
        }
      });
    }
  }
  return rows;
}

export function parseIndianSouthAsianNoLocations(html: string): IndianSouthAsianNoLocation[] {
  const text = decodeHtmlText(html);
  const locations: IndianSouthAsianNoLocation[] = [];

  if (/Norbygata\s+Dagligvare|Norbygata\s+Grocery/i.test(text) && /T[oø]yengata\s+3/i.test(text)) {
    locations.push({
      storeId: 'toyengata-retail',
      name: 'Norbygata Dagligvare',
      city: 'Oslo',
      address: 'Toyengata 3, 0190 Oslo',
      country: 'NO',
      channel: 'retail_store',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_RETAIL_DIRECTORY_URL,
      evidenceText: sentenceContaining(text, /T[oø]yengata\s+3/i)
    });
  }

  if (/Norbygata\s+Engros/i.test(text) && /Ulvenveien\s+102/i.test(text)) {
    locations.push({
      storeId: 'ulvenveien-wholesale-online',
      name: 'Norbygata Engros',
      city: 'Oslo',
      address: 'Ulvenveien 102, 0581 Oslo',
      country: 'NO',
      channel: 'wholesale_online',
      sourceUrl: INDIAN_SOUTH_ASIAN_NO_NORBYGATA_PRIVACY_URL,
      evidenceText: sentenceContaining(text, /Ulvenveien\s+102/i)
    });
  }

  return locations;
}

export function isWhitelistedIndianSouthAsianNoCategory(value: string): value is IndianSouthAsianNoCategory {
  return (INDIAN_SOUTH_ASIAN_NO_CATEGORY_WHITELIST as readonly string[]).includes(value);
}

export function verifyIndianSouthAsianNoChainStatus(): IndianSouthAsianNoChainStatus {
  return INDIAN_SOUTH_ASIAN_NO_CHAIN_STATUS;
}

function hasSouthAsianNorbygataEvidence(text: string): boolean {
  return /Norbygata/i.test(text) && (
    /s[oø]rasiatisk\s+kj[oø]kken/i.test(text)
    || /Indisk\s+og\s+Pakistansk/i.test(text)
    || /Indian\s+and\s+Pakistani/i.test(text)
  );
}

function sentenceContaining(text: string, pattern: RegExp): string {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
  return sentences.find((sentence) => pattern.test(sentence)) ?? '';
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&laquo;|&raquo;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}
