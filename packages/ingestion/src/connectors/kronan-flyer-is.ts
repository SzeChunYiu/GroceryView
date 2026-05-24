export type KronanFlyerIsOffer = {
  id: string;
  name: string;
  url: string;
  country: 'IS';
  currency: 'ISK';
  source: 'kronan.is';
  memberTier: 'member';
  price?: number;
  originalPrice?: number;
  imageUrl?: string;
  validFrom?: string;
  validTo?: string;
};

export type KronanFlyerIsFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ text(): Promise<string> }>;

export const KRONAN_FLYER_IS_URL = 'https://kronan.is/voruurval/afslaettir';
export const KRONAN_FLYER_IS_CONNECTOR = {
  id: 'kronan-flyer-is',
  chain: 'Krónan',
  country: 'IS',
  currency: 'ISK',
  memberTier: 'member',
  url: KRONAN_FLYER_IS_URL
} as const;

export async function fetchKronanFlyerIsOffers(fetchImpl: KronanFlyerIsFetch = fetch): Promise<KronanFlyerIsOffer[]> {
  const response = await fetchImpl(KRONAN_FLYER_IS_URL, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion kronan-flyer-is/1.0'
    }
  });
  return parseKronanFlyerIsOffers(await response.text());
}

export function parseKronanFlyerIsOffers(html: string): KronanFlyerIsOffer[] {
  const decoded = decodeHtml(html)
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\\"/g, '"');
  const offers = new Map<string, KronanFlyerIsOffer>();

  for (const product of collectJsonProductCandidates(decoded)) {
    const name = cleanText(product.name);
    if (!name) continue;
    const url = absoluteKronanUrl(product.url ?? product.slug ?? product.path ?? '');
    const id = stableOfferId(product.id ?? product.sku ?? product.slug ?? name);
    offers.set(id, {
      id,
      name,
      url,
      country: 'IS',
      currency: 'ISK',
      source: 'kronan.is',
      memberTier: 'member',
      price: parseIsk(product.price ?? product.offerPrice ?? product.salePrice ?? product.memberPrice),
      originalPrice: parseIsk(product.originalPrice ?? product.regularPrice ?? product.beforePrice),
      imageUrl: typeof product.image === 'string' ? product.image : typeof product.imageUrl === 'string' ? product.imageUrl : undefined,
      validFrom: typeof product.validFrom === 'string' ? product.validFrom : undefined,
      validTo: typeof product.validTo === 'string' ? product.validTo : undefined
    });
  }

  if (offers.size === 0) {
    for (const match of decoded.matchAll(/href="(?<url>[^"]+)"[^>]*>\s*(?:<[^>]+>\s*)*(?<name>[^<]{3,120}?)(?:\s*<[^>]+>)*\s*(?<price>\d{2,6})\s*(?:kr\.?|ISK)/gimu)) {
      const name = cleanText(match.groups?.name ?? '');
      if (!name) continue;
      const id = stableOfferId(`${name}-${match.groups?.price ?? ''}`);
      offers.set(id, {
        id,
        name,
        url: absoluteKronanUrl(match.groups?.url ?? ''),
        country: 'IS',
        currency: 'ISK',
        source: 'kronan.is',
        memberTier: 'member',
        price: parseIsk(match.groups?.price)
      });
    }
  }

  return [...offers.values()];
}

function collectJsonProductCandidates(source: string): Record<string, unknown>[] {
  const candidates: Record<string, unknown>[] = [];
  for (const match of source.matchAll(/\{[^{}]{0,2000}"name"\s*:\s*"[^"]+"[^{}]{0,2000}\}/gmu)) {
    try {
      const parsed = JSON.parse(match[0]);
      if (parsed && typeof parsed === 'object') candidates.push(parsed as Record<string, unknown>);
    } catch {
      // Ignore non-JSON React flight fragments; the fallback parser handles visible cards.
    }
  }
  return candidates.filter((candidate) => {
    const category = `${candidate.category ?? ''} ${candidate.tags ?? ''} ${candidate.badge ?? ''}`.toLowerCase();
    return category.includes('tilbo') || category.includes('afsl') || candidate.offerPrice !== undefined || candidate.salePrice !== undefined || candidate.memberPrice !== undefined;
  });
}

function parseIsk(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function absoluteKronanUrl(path: string): string {
  if (!path) return KRONAN_FLYER_IS_URL;
  if (path.startsWith('http')) return path;
  return `https://kronan.is${path.startsWith('/') ? '' : '/'}${path}`;
}

function stableOfferId(value: unknown): string {
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
