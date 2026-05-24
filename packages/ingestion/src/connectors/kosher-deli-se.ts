export type KosherDeliRetailerType = 'kosher_halal';

export type KosherDeliSeRow = {
  id: string;
  name: string;
  category: string;
  country: 'SE';
  currency: 'SEK';
  chain: 'kosher-deli';
  retailer_type: KosherDeliRetailerType;
  storeName: string;
  address: string;
  city: string;
  phone: string;
  website: string;
  price: number | null;
  priceText: string;
  limited_coverage_gap: boolean;
  coverageNote: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchKosherDeliSeRowsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export const KOSHER_DELI_SE_SOURCE_URL = 'https://www.jeschurun.se/in-english/kosher-in-stockholm/';
export const KOSHER_DELI_SE_CHAIN = 'kosher-deli';
export const KOSHER_DELI_SE_OVERLAP_CATEGORIES = ['meat', 'charcuterie', 'dairy', 'cheese', 'dry-goods', 'sweets'] as const;
export const KOSHER_DELI_SE_LIMITED_COVERAGE_NOTE = 'Primary sources verify Kosherian as a Stockholm kosher shop, not a multi-location Swedish chain.';

const DEFAULT_ROWS: Array<Pick<KosherDeliSeRow, 'id' | 'name' | 'category' | 'price' | 'priceText'>> = [
  { id: 'kosherian-meat', name: 'Kosher meat assortment', category: 'meat', price: null, priceText: '' },
  { id: 'kosherian-charcuterie', name: 'Kosher charcuterie assortment', category: 'charcuterie', price: null, priceText: '' },
  { id: 'kosherian-cheese', name: 'Kosher cheese assortment', category: 'cheese', price: null, priceText: '' },
  { id: 'kosherian-dry-goods', name: 'Kosher dry goods assortment', category: 'dry-goods', price: null, priceText: '' },
  { id: 'kosherian-dairy', name: 'Kosher dairy assortment', category: 'dairy', price: null, priceText: '' },
  { id: 'kosherian-sweets', name: 'Kosher sweets assortment', category: 'sweets', price: null, priceText: '' }
];

export async function fetchKosherDeliSeRows(options: FetchKosherDeliSeRowsOptions = {}): Promise<KosherDeliSeRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? KOSHER_DELI_SE_SOURCE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (!response.ok) {
    throw new Error(`Kosher deli SE source request failed: ${response.status}`);
  }

  return parseKosherDeliSeRows(await response.text(), { sourceUrl, retrievedAt });
}

export function parseKosherDeliSeRows(html: string, context: { sourceUrl: string; retrievedAt: string }): KosherDeliSeRow[] {
  const textContent = stripTags(html).toLocaleLowerCase('sv-SE');
  const storeName = textContent.includes('kosherian') ? 'Kosherian' : 'Kosherian i Bajit / Makolet';
  const address = extractAddress(html) || 'Nybrogatan 19A, Stockholm';
  const phone = extractPhone(html) || '+4686636580';
  const website = extractWebsite(html) || 'https://www.kosherian.se';

  return DEFAULT_ROWS
    .filter((row) => isOverlapCategory(row.category))
    .map((row) => ({
      ...row,
      country: 'SE' as const,
      currency: 'SEK' as const,
      chain: KOSHER_DELI_SE_CHAIN,
      retailer_type: 'kosher_halal' as const,
      storeName,
      address,
      city: 'Stockholm',
      phone,
      website,
      limited_coverage_gap: true,
      coverageNote: KOSHER_DELI_SE_LIMITED_COVERAGE_NOTE,
      sourceUrl: context.sourceUrl,
      retrievedAt: context.retrievedAt
    }));
}

export function isOverlapCategory(category: string): boolean {
  return (KOSHER_DELI_SE_OVERLAP_CATEGORIES as readonly string[]).includes(category);
}

function stripTags(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ');
}

function extractAddress(html: string): string {
  const text = stripTags(html).replace(/\s+/g, ' ');
  return text.match(/(?:Address:|Adress:)?\s*(Nybrogatan\s+19A|Wahrendorffsgatan\s+3B)[^\d]*(\d{3}\s?\d{2})?\s*(Stockholm)?/i)?.[0]?.trim() ?? '';
}

function extractPhone(html: string): string {
  return stripTags(html).match(/(?:\+46|0)\s?\d[\d\s-]{6,}/)?.[0]?.replace(/\s+/g, '') ?? '';
}

function extractWebsite(html: string): string {
  const match = html.match(/https?:\/\/(?:www\.)?kosherian\.se[^"'\s<]*/i) ?? html.match(/www\.kosherian\.se/i);
  if (!match?.[0]) return '';
  return match[0].startsWith('http') ? match[0] : `https://${match[0]}`;
}
