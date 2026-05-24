export type JokerFlyerNoPromotionRow = {
  id: string;
  name: string;
  url: string;
  country: 'NO';
  currency: 'NOK';
  source: 'joker.no';
  memberTier: 'public' | 'joker_glad';
  price?: number;
  originalPrice?: number;
  unitPrice?: string;
  imageUrl?: string;
  validFrom?: string;
  validTo?: string;
};

export type JokerFlyerNoFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ text(): Promise<string> }>;

export const JOKER_FLYER_NO_URL = 'https://joker.no/varer/tilbud';
export const JOKER_FLYER_NO_FALLBACK_URL = 'https://joker.no/nettbutikk/varer/tilbud';
export const JOKER_FLYER_NO_CONNECTOR = {
  id: 'joker-flyer-no',
  chain: 'Joker',
  country: 'NO',
  currency: 'NOK',
  source: 'joker.no',
  url: JOKER_FLYER_NO_URL
} as const;

export async function fetchJokerFlyerNoPromotions(fetchImpl: JokerFlyerNoFetch = fetch): Promise<JokerFlyerNoPromotionRow[]> {
  const html = await fetchJokerFlyerPage(fetchImpl, JOKER_FLYER_NO_URL);
  const rows = parseJokerFlyerNoPromotions(html, JOKER_FLYER_NO_URL);
  if (rows.length > 0) return rows;
  return parseJokerFlyerNoPromotions(await fetchJokerFlyerPage(fetchImpl, JOKER_FLYER_NO_FALLBACK_URL), JOKER_FLYER_NO_FALLBACK_URL);
}

export function parseJokerFlyerNoPromotions(html: string, sourceUrl = JOKER_FLYER_NO_URL): JokerFlyerNoPromotionRow[] {
  const decoded = decodeHtml(html)
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\"/g, '"');
  const rows = new Map<string, JokerFlyerNoPromotionRow>();

  for (const product of collectJsonPromotionCandidates(decoded)) {
    const name = cleanText(product.name ?? product.title);
    if (!name) continue;
    const context = JSON.stringify(product).toLowerCase();
    const id = stablePromotionId(product.id ?? product.ean ?? product.sku ?? product.slug ?? name);
    rows.set(id, {
      id,
      name,
      url: absoluteJokerUrl(String(product.url ?? product.path ?? product.slug ?? sourceUrl)),
      country: 'NO',
      currency: 'NOK',
      source: 'joker.no',
      memberTier: context.includes('joker glad') || context.includes('trumf') ? 'joker_glad' : 'public',
      price: parseNok(product.price ?? product.offerPrice ?? product.salePrice ?? product.campaignPrice),
      originalPrice: parseNok(product.originalPrice ?? product.regularPrice ?? product.beforePrice),
      unitPrice: typeof product.unitPrice === 'string' ? product.unitPrice : undefined,
      imageUrl: typeof product.image === 'string' ? product.image : typeof product.imageUrl === 'string' ? product.imageUrl : undefined,
      validFrom: typeof product.validFrom === 'string' ? product.validFrom : undefined,
      validTo: typeof product.validTo === 'string' ? product.validTo : undefined
    });
  }

  if (rows.size === 0) {
    for (const match of decoded.matchAll(/href="(?<url>[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*(?<name>[^<]{3,140}?)(?:\s*<[^>]+>)*\s*(?<price>\d{1,4}(?:[,.]\d{1,2})?)\s*(?:kr|NOK)/gimu)) {
      const name = cleanText(match.groups?.name ?? '');
      if (!name) continue;
      const id = stablePromotionId(`${name}-${match.groups?.price ?? ''}`);
      rows.set(id, {
        id,
        name,
        url: absoluteJokerUrl(match.groups?.url ?? sourceUrl),
        country: 'NO',
        currency: 'NOK',
        source: 'joker.no',
        memberTier: /joker\s+glad|trumf/iu.test(match[0]) ? 'joker_glad' : 'public',
        price: parseNok(match.groups?.price)
      });
    }
  }

  return [...rows.values()];
}

async function fetchJokerFlyerPage(fetchImpl: JokerFlyerNoFetch, url: string): Promise<string> {
  const response = await fetchImpl(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion joker-flyer-no/1.0'
    }
  });
  return response.text();
}

function collectJsonPromotionCandidates(source: string): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [];
  for (const match of source.matchAll(/\{[^{}]{0,2200}"(?:name|title)"\s*:\s*"[^"]+"[^{}]{0,2200}\}/gmu)) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object') candidates.push(parsed as Record<string, unknown>);
    } catch {
      // React/Optimizely fragments are not always standalone JSON.
    }
  }
  return candidates.filter((candidate) => {
    const context = `${candidate.category ?? ''} ${candidate.tags ?? ''} ${candidate.badge ?? ''} ${candidate.url ?? ''}`.toLowerCase();
    return context.includes('tilbud') || context.includes('kampanje') || candidate.offerPrice !== undefined || candidate.salePrice !== undefined || candidate.campaignPrice !== undefined;
  });
}

function parseNok(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\s/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function absoluteJokerUrl(path: string): string {
  if (!path) return JOKER_FLYER_NO_URL;
  if (path.startsWith('http')) return path;
  return `https://joker.no${path.startsWith('/') ? '' : '/'}${path}`;
}

function stablePromotionId(value: unknown): string {
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
