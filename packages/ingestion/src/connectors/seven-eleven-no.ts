export type SevenElevenNoStore = {
  storeId: string;
  name: string;
  chain: '7-eleven' | 'uno-x-7-eleven';
  department: string;
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  sourceUrl: string;
  retrievedAt: string;
};

export const SEVEN_ELEVEN_NO_BASE_URL = 'https://www.7-eleven.no';
export const SEVEN_ELEVEN_NO_STORES_PATH = '/butikker';

export type FetchSevenElevenNoStoresOptions = {
  fetchImpl?: typeof fetch;
  maxRows?: number;
  retrievedAt?: string;
  baseUrl?: string;
};

export function buildSevenElevenNoStoresUrl(baseUrl = SEVEN_ELEVEN_NO_BASE_URL): string {
  return new URL(SEVEN_ELEVEN_NO_STORES_PATH, baseUrl).toString();
}

export async function fetchSevenElevenNoStores(
  options: FetchSevenElevenNoStoresOptions = {}
): Promise<SevenElevenNoStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = buildSevenElevenNoStoresUrl(options.baseUrl);
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`7-Eleven Norway stores request failed: ${response.status}`);

  const rows = parseSevenElevenNoStores(await response.text(), sourceUrl, retrievedAt);
  if (rows.length === 0) throw new Error('7-Eleven Norway store directory had no usable stores.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseSevenElevenNoStores(html: string, sourceUrl: string, retrievedAt: string): SevenElevenNoStore[] {
  const rows: SevenElevenNoStore[] = [];
  const seen = new Set<string>();
  const itemPattern = /<li\b([^>]*)>([\s\S]*?)<\/li>/gi;
  for (const match of html.matchAll(itemPattern)) {
    const attrs = match[1] ?? '';
    const body = match[2] ?? '';
    const storeId = attr(attrs, 'data-storeid');
    const title = decodeHtml(attr(attrs, 'data-title'));
    const department = attr(attrs, 'data-department');
    const lat = numberOrNull(attr(attrs, 'data-lat'));
    const lng = numberOrNull(attr(attrs, 'data-lng'));
    const address = decodeHtml(textFromClass(body, 'street-address'));
    const city = decodeHtml(textFromClass(body, 'locality'));
    const name = decodeHtml(textFromClass(body, 'name')) || title;
    if (!storeId || !name || seen.has(storeId)) continue;
    seen.add(storeId);
    rows.push({
      storeId,
      name,
      chain: department === '77' ? 'uno-x-7-eleven' : '7-eleven',
      department,
      address,
      city,
      latitude: lat,
      longitude: lng,
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

function attr(attrs: string, name: string): string {
  const match = attrs.match(new RegExp(`${name}=(['"])(.*?)\\1`, 'i'));
  return match ? match[2] : '';
}

function textFromClass(html: string, className: string): string {
  const match = html.match(new RegExp(`<[^>]*class=(['"])[^'"]*\\b${className}\\b[^'"]*\\1[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return match ? stripTags(match[2]) : '';
}

function stripTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function numberOrNull(value: string): number | null {
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
