export type TempoSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'tempo';
  code: string;
  name: string;
  price: number;
  priceText: string;
  packageText: string;
  sourceUrl: string;
  retrievedAt: string;
};

type TempoSearchItem = {
  code?: unknown;
  ean?: unknown;
  id?: unknown;
  name?: unknown;
  title?: unknown;
  price?: unknown;
  priceText?: unknown;
  packageText?: unknown;
  package?: unknown;
};

export const TEMPO_SE_SEARCH_BASE_URL = 'https://www.tempo.nu/sok';
export const DEFAULT_TEMPO_SE_QUERIES = ['mjolk', 'kaffe', 'pasta', 'brod', 'agg'] as const;
export const ALL_STORE_RUNNER_TEMPO_SE_CONNECTOR_ID = 'tempo-se-chainwide-products';

export function buildTempoSeSearchUrl(query: string): string {
  const url = new URL(TEMPO_SE_SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  return url.toString();
}

export async function fetchTempoSeProducts(options: {
  fetchImpl?: typeof fetch;
  queries?: readonly string[];
  retrievedAt?: string;
} = {}): Promise<TempoSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: TempoSeProduct[] = [];
  const seen = new Set<string>();

  for (const query of options.queries ?? DEFAULT_TEMPO_SE_QUERIES) {
    const sourceUrl = buildTempoSeSearchUrl(query);
    const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/json', 'user-agent': 'GroceryView/0.1' } });
    if (!response.ok) throw new Error(`Tempo SE search failed for ${query}: ${response.status}`);
    for (const item of parseTempoSeProducts(await response.text())) {
      const row = normalizeTempoSeProduct(item, sourceUrl, retrievedAt);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
    }
  }

  return rows;
}

export function parseTempoSeProducts(body: string): TempoSearchItem[] {
  try {
    const parsed = JSON.parse(body) as { products?: TempoSearchItem[]; results?: TempoSearchItem[] } | TempoSearchItem[];
    if (Array.isArray(parsed)) return parsed;
    return parsed.products ?? parsed.results ?? [];
  } catch {
    const script = body.match(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i)?.[1];
    if (!script) return [];
    const parsed = JSON.parse(script) as { itemListElement?: Array<{ item?: TempoSearchItem }> };
    return parsed.itemListElement?.map((entry) => entry.item).filter((item): item is TempoSearchItem => Boolean(item)) ?? [];
  }
}

export function normalizeTempoSeProduct(item: TempoSearchItem, sourceUrl: string, retrievedAt: string): TempoSeProduct | null {
  const code = text(item.code ?? item.ean ?? item.id);
  const name = text(item.name ?? item.title);
  const price = parsePrice(item.price ?? item.priceText);
  if (!code || !name || price === null) return null;
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'tempo',
    code,
    name,
    price,
    priceText: `${price.toFixed(2)} SEK`,
    packageText: text(item.packageText ?? item.package),
    sourceUrl,
    retrievedAt
  };
}

function parsePrice(value: unknown): number | null {
  const numberValue = typeof value === 'number' ? value : Number.parseFloat(text(value).replace(',', '.').replace(/[^0-9.]/g, ''));
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}
