export type BiltemaNoHouseholdProduct = {
  id: string;
  name: string;
  url: string;
  country: 'NO';
  currency: 'NOK';
  category: 'household';
  source: 'biltema.no';
  price?: number;
  articleNumber?: string;
  imageUrl?: string;
  inStock?: boolean;
};

export type BiltemaNoFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ text(): Promise<string> }>;

export const BILTEMA_NO_URL = 'https://www.biltema.no/';
export const BILTEMA_NO_SEARCH_URL = 'https://www.biltema.no/en-no/search-page/?query=';
export const BILTEMA_NO_CONNECTOR = {
  id: 'biltema-no',
  chain: 'Biltema',
  country: 'NO',
  currency: 'NOK',
  category: 'household',
  url: BILTEMA_NO_URL
} as const;

export async function searchBiltemaNoHouseholdProducts(
  query: string,
  fetchImpl: BiltemaNoFetch = fetch
): Promise<BiltemaNoHouseholdProduct[]> {
  const response = await fetchImpl(`${BILTEMA_NO_SEARCH_URL}${encodeURIComponent(query)}`, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion biltema-no/1.0'
    }
  });
  return parseBiltemaNoHouseholdProducts(await response.text());
}

export function parseBiltemaNoHouseholdProducts(html: string): BiltemaNoHouseholdProduct[] {
  const decoded = decodeHtml(html)
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\"/g, '"');
  const products = new Map<string, BiltemaNoHouseholdProduct>();

  for (const candidate of collectJsonProductCandidates(decoded)) {
    const name = cleanText(candidate.name ?? candidate.title);
    if (!name || !isHouseholdCandidate(name, candidate)) continue;
    const articleNumber = cleanText(candidate.articleNumber ?? candidate.articleNo ?? candidate.sku);
    const id = stableProductId(articleNumber || candidate.id || candidate.slug || name);
    products.set(id, {
      id,
      name,
      url: absoluteBiltemaUrl(String(candidate.url ?? candidate.path ?? candidate.slug ?? '')),
      country: 'NO',
      currency: 'NOK',
      category: 'household',
      source: 'biltema.no',
      price: parseNok(candidate.price ?? candidate.salesPrice ?? candidate.currentPrice),
      articleNumber: articleNumber || undefined,
      imageUrl: typeof candidate.image === 'string' ? candidate.image : typeof candidate.imageUrl === 'string' ? candidate.imageUrl : undefined,
      inStock: typeof candidate.inStock === 'boolean' ? candidate.inStock : undefined
    });
  }

  if (products.size === 0) {
    for (const match of decoded.matchAll(/href="(?<url>[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*(?<name>[^<]{3,140}?)(?:\s*<[^>]+>)*\s*(?<price>\d{1,5}(?:[,.]\d{1,2})?)\s*(?:kr|NOK)/gimu)) {
      const name = cleanText(match.groups?.name ?? '');
      if (!isHouseholdName(name)) continue;
      const id = stableProductId(`${name}-${match.groups?.price ?? ''}`);
      products.set(id, {
        id,
        name,
        url: absoluteBiltemaUrl(match.groups?.url ?? ''),
        country: 'NO',
        currency: 'NOK',
        category: 'household',
        source: 'biltema.no',
        price: parseNok(match.groups?.price)
      });
    }
  }

  return [...products.values()];
}

function collectJsonProductCandidates(source: string): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [];
  for (const match of source.matchAll(/\{[^{}]{0,2200}"(?:name|title)"\s*:\s*"[^"]+"[^{}]{0,2200}\}/gmu)) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object') candidates.push(parsed as Record<string, unknown>);
    } catch {
      // Ignore non-standalone framework JSON fragments.
    }
  }
  return candidates;
}

function isHouseholdCandidate(name: string, candidate: Record<string, unknown>): boolean {
  const context = `${name} ${candidate.category ?? ''} ${candidate.breadcrumb ?? ''} ${candidate.url ?? ''}`.toLowerCase();
  return isHouseholdName(context);
}

function isHouseholdName(value: string): boolean {
  return /household|husholdning|rengjør|renhold|kjøkken|kitchen|storage|oppbevaring|vask|clean|batteri|lyspære|pære|avfall|søppel|fritid/iu.test(value);
}

function parseNok(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function absoluteBiltemaUrl(path: string): string {
  if (!path) return BILTEMA_NO_URL;
  if (path.startsWith('http')) return path;
  return `https://www.biltema.no${path.startsWith('/') ? '' : '/'}${path}`;
}

function stableProductId(value: unknown): string {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function cleanText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}
