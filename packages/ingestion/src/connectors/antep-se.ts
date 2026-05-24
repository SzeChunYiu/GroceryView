export type AntepSeRetailerType = 'ethnic_middle_eastern';

export type AntepSeRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'antep';
  retailer_type: AntepSeRetailerType;
  operation: 'Antep Market' | 'Yara Market' | 'Orientlivs' | 'Matvärlden';
  storeName: string;
  city: string;
  productName: string;
  brand: string;
  category: string;
  price: number;
  unit: string;
  sourceUrl: string;
  retrievedAt: string;
};

type RawAntepRecord = Record<string, unknown>;

export type FetchAntepSeRowsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export const ANTEP_SE_SOURCE_URL = 'https://www.antepmarket.se/';

export const MULTI_STORE_MIDDLE_EASTERN_OPERATIONS_SE = [
  'Antep Market',
  'Yara Market',
  'Orientlivs',
  'Matvärlden'
] as const;

const OPERATION_ALIASES: Array<{ operation: AntepSeRow['operation']; pattern: RegExp }> = [
  { operation: 'Antep Market', pattern: /\bantep\b/i },
  { operation: 'Yara Market', pattern: /\byara\b/i },
  { operation: 'Orientlivs', pattern: /\borient\s*livs|orientlivs\b/i },
  { operation: 'Matvärlden', pattern: /\bmatvärlden|matvarlden\b/i }
];

const OVERLAP_CATEGORY_WHITELIST = new Set([
  'bakery',
  'beverages',
  'dairy',
  'frozen',
  'fruit_veg',
  'grains_rice_pasta',
  'meat',
  'pantry',
  'sauces_condiments',
  'snacks_sweets',
  'spices',
  'tea_coffee'
]);

export async function fetchAntepSeRows(options: FetchAntepSeRowsOptions = {}): Promise<AntepSeRow[]> {
  const sourceUrl = options.sourceUrl ?? ANTEP_SE_SOURCE_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/json,text/csv,text/html;q=0.9',
      'user-agent': 'GroceryView/0.1 antep-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Antep SE source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Antep SE source failed with HTTP ${response.status}`);

  return parseAntepSeRows(await response.text(), { sourceUrl, retrievedAt });
}

export function parseAntepSeRows(body: unknown, context: { sourceUrl?: string; retrievedAt: string }): AntepSeRow[] {
  const sourceUrl = context.sourceUrl ?? ANTEP_SE_SOURCE_URL;
  const rows = rawRecords(body)
    .map((record) => normalizeAntepSeRow(record, { sourceUrl, retrievedAt: context.retrievedAt }))
    .filter((row): row is AntepSeRow => row !== null);

  if (rows.length === 0) throw new Error('No multi-store Middle Eastern grocery rows matched the SE overlap category whitelist.');
  return rows;
}

export function normalizeAntepSeRow(record: RawAntepRecord, context: { sourceUrl: string; retrievedAt: string }): AntepSeRow | null {
  const operation = identifyMultiStoreOperation(firstText(record.chain, record.operation, record.retailer, record.storeName, record.name));
  if (!operation) return null;

  const category = normalizeOverlapCategory(firstText(record.category, record.department, record.productCategory));
  if (!category || !OVERLAP_CATEGORY_WHITELIST.has(category)) return null;

  const productName = firstText(record.productName, record.product, record.title, record.name);
  const price = firstPrice(record.price, record.currentPrice, record.amount);
  if (!productName || price === null) return null;

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'antep',
    retailer_type: 'ethnic_middle_eastern',
    operation,
    storeName: firstText(record.storeName, record.store, record.location) || operation,
    city: firstText(record.city, record.town, record.locality),
    productName,
    brand: firstText(record.brand, record.manufacturer),
    category,
    price,
    unit: firstText(record.unit, record.packageText, record.size) || 'st',
    sourceUrl: context.sourceUrl,
    retrievedAt: context.retrievedAt
  };
}

export function identifyMultiStoreOperation(value: string): AntepSeRow['operation'] | null {
  const match = OPERATION_ALIASES.find((candidate) => candidate.pattern.test(value));
  return match?.operation ?? null;
}

export function normalizeOverlapCategory(value: string): string | null {
  const normalized = value.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (!normalized) return null;
  if (/krydd|spice|baharat/.test(normalized)) return 'spices';
  if (/ris|pasta|bulgur|grain|couscous/.test(normalized)) return 'grains_rice_pasta';
  if (/frukt|gront|produce|vegetable/.test(normalized)) return 'fruit_veg';
  if (/meat|kott|kyckling|chark/.test(normalized)) return 'meat';
  if (/mejeri|dairy|yoghurt|ost/.test(normalized)) return 'dairy';
  if (/brod|bakery|pita|lavash/.test(normalized)) return 'bakery';
  if (/dryck|beverage|juice/.test(normalized)) return 'beverages';
  if (/kaffe|te|coffee|tea/.test(normalized)) return 'tea_coffee';
  if (/snack|godis|sweet|baklava/.test(normalized)) return 'snacks_sweets';
  if (/sas|sauce|condiment|olja|oil/.test(normalized)) return 'sauces_condiments';
  if (/frys|frozen/.test(normalized)) return 'frozen';
  if (/pantry|konserv|beans|bonor|linser/.test(normalized)) return 'pantry';
  return OVERLAP_CATEGORY_WHITELIST.has(normalized) ? normalized : null;
}

function rawRecords(body: unknown): RawAntepRecord[] {
  if (Array.isArray(body)) return body.filter(isRecord);
  if (isRecord(body)) {
    for (const key of ['items', 'products', 'offers', 'rows', 'data']) {
      const value = body[key];
      if (Array.isArray(value)) return value.filter(isRecord);
    }
    return [body];
  }
  if (typeof body !== 'string') return [];
  const json = parseJson(body);
  if (json) return rawRecords(json);
  return parseCsv(body);
}

function parseCsv(csv: string): RawAntepRecord[] {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2 || !/,|;|\t/.test(lines[0])) return [];
  const separator = lines[0].includes(';') ? ';' : lines[0].includes('\t') ? '\t' : ',';
  const headers = lines[0].split(separator).map((header) => header.trim());
  return lines.slice(1).map((line) => Object.fromEntries(line.split(separator).map((value, index) => [headers[index] ?? `field_${index}`, value.trim()])));
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is RawAntepRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function firstPrice(...values: unknown[]): number | null {
  for (const value of values) {
    const price = parsePrice(value);
    if (price !== null) return price;
  }
  return null;
}

function parsePrice(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.round((value + Number.EPSILON) * 100) / 100;
  if (typeof value !== 'string') return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.').replace(/(?:kr|sek)$/i, ''));
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}
