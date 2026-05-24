export type ApotekGardabaerCategory = 'medicine' | 'otc' | 'healthcare' | 'supplement' | 'beauty';

export type ApotekGardabaerAssortmentItem = {
  chain: 'apotek-gardabaer';
  countryCode: 'IS';
  pharmacyName: 'Apótek Garðabæjar';
  category: ApotekGardabaerCategory;
  name: string;
  description: string;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type ApotekGardabaerContact = {
  chain: 'apotek-gardabaer';
  countryCode: 'IS';
  pharmacyName: 'Apótek Garðabæjar';
  address: string;
  postalCode: string;
  locality: string;
  phone: string;
  email: string;
  businessHoursText: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchApotekGardabaerOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  sourceUrl?: string;
};

export const APOTEK_GARDABAER_BASE_URL = 'https://apotekgb.is';
export const APOTEK_GARDABAER_HOME_URL = `${APOTEK_GARDABAER_BASE_URL}/`;
export const APOTEK_GARDABAER_PRODUCTS_URL = `${APOTEK_GARDABAER_BASE_URL}/vorur/`;

const ASSORTMENT_RULES: Array<{
  category: ApotekGardabaerCategory;
  name: string;
  description: string;
  markers: readonly string[];
  productUrl?: string;
}> = [
  {
    category: 'medicine',
    name: 'Helstu lyf',
    description: 'Local pharmacy assortment signal for core medicines; prescription stock is not price-ingested.',
    markers: ['öll helstu lyf', 'helstu lyf']
  },
  {
    category: 'otc',
    name: 'Lausasölulyf',
    description: 'Over-the-counter medicine assortment advertised by the pharmacy product page.',
    markers: ['lausasölulyf', 'lyfskyldum lyfjum']
  },
  {
    category: 'healthcare',
    name: 'Hjúkrunarvörur',
    description: 'Healthcare and nursing supplies assortment advertised by the pharmacy product page.',
    markers: ['hjúkrunarvörum', 'hjukrunarvorum']
  },
  {
    category: 'supplement',
    name: 'Vítamín og fæðubótarefni',
    description: 'Vitamin and supplement assortment advertised by the pharmacy product page.',
    markers: ['vítamínum og fæðubótarefnum', 'vitaminum og faedubotarefnum'],
    productUrl: 'https://heilsa.is/'
  },
  {
    category: 'supplement',
    name: 'Yggdrasill',
    description: 'Supplier/product-information link exposed by Apótek Garðabæjar for supplements and natural health products.',
    markers: ['yggdrasill.is'],
    productUrl: 'https://yggdrasill.is/'
  },
  {
    category: 'beauty',
    name: 'Snyrtivörur',
    description: 'Beauty products assortment advertised by the pharmacy product page.',
    markers: ['snyrtivörur', 'snyrtivorur']
  },
  {
    category: 'beauty',
    name: 'Weleda',
    description: 'Brand/product-information link exposed by Apótek Garðabæjar.',
    markers: ['welada.is', 'weleda.is'],
    productUrl: 'https://welada.is/'
  },
  {
    category: 'beauty',
    name: 'Eucerin',
    description: 'Brand/product-information link exposed by Apótek Garðabæjar.',
    markers: ['www.eucerin.com', 'eucerin.com'],
    productUrl: 'https://www.eucerin.com/'
  }
];

export async function fetchApotekGardabaerAssortment(
  options: FetchApotekGardabaerOptions = {}
): Promise<ApotekGardabaerAssortmentItem[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? APOTEK_GARDABAER_PRODUCTS_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, htmlHeaders());
  if (!response.ok) throw new Error(`Apótek Garðabæjar request failed for ${sourceUrl}: ${response.status}`);
  const rows = parseApotekGardabaerAssortment(await response.text(), sourceUrl, retrievedAt);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export async function fetchApotekGardabaerContact(
  options: FetchApotekGardabaerOptions = {}
): Promise<ApotekGardabaerContact> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? APOTEK_GARDABAER_HOME_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, htmlHeaders());
  if (!response.ok) throw new Error(`Apótek Garðabæjar contact request failed for ${sourceUrl}: ${response.status}`);
  return parseApotekGardabaerContact(await response.text(), sourceUrl, retrievedAt);
}

export function parseApotekGardabaerAssortment(
  html: string,
  sourceUrl: string,
  retrievedAt: string
): ApotekGardabaerAssortmentItem[] {
  const text = normalizedText(html);
  const rows: ApotekGardabaerAssortmentItem[] = [];
  const seen = new Set<string>();
  for (const rule of ASSORTMENT_RULES) {
    if (!rule.markers.some((marker) => text.includes(normalizeSearchText(marker)))) continue;
    const productUrl = rule.productUrl ?? sourceUrl;
    const key = `${rule.category}:${rule.name}:${productUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      chain: 'apotek-gardabaer',
      countryCode: 'IS',
      pharmacyName: 'Apótek Garðabæjar',
      category: rule.category,
      name: rule.name,
      description: rule.description,
      productUrl,
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

export function parseApotekGardabaerContact(html: string, sourceUrl: string, retrievedAt: string): ApotekGardabaerContact {
  const text = visibleText(html);
  const footer = htmlDecode(html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? html);
  const addressMatch = footer.match(/Litlatún\s+3\s*[–-]\s*210\s+Garðabær/i)
    ?? text.match(/Litlatún\s+3\s*[–-]\s*210\s+Garðabær/i);
  const phoneMatch = text.match(/(?:Phone\s*)?(577\s*5010)/i);
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  const hoursMatch = text.match(/Business hours:\s*([^<\n]+?)(?:\s+[A-Z0-9._%+-]+@|$)/i)
    ?? footer.match(/Business hours:\s*([^<]+?)\s*(?:apotek@|$)/i);

  return {
    chain: 'apotek-gardabaer',
    countryCode: 'IS',
    pharmacyName: 'Apótek Garðabæjar',
    address: addressMatch ? 'Litlatún 3' : '',
    postalCode: addressMatch ? '210' : '',
    locality: addressMatch ? 'Garðabær' : '',
    phone: phoneMatch?.[1]?.replace(/\s+/g, ' ') ?? '',
    email: emailMatch?.[0] ?? '',
    businessHoursText: hoursMatch?.[1]?.replace(/\s+/g, ' ').trim() ?? '',
    sourceUrl,
    retrievedAt
  };
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml,application/json',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}

function visibleText(html: string): string {
  return htmlDecode(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizedText(html: string): string {
  return normalizeSearchText(visibleText(html));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function htmlDecode(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
