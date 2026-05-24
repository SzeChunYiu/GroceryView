export type VitusapotekNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'vitusapotek';
  id: string;
  name: string;
  price: number | null;
  unitPrice: number | null;
  url: string;
  imageUrl: string | null;
  availability: string | null;
  observedAt: string;
};

type VitusapotekNoRawProduct = {
  id?: string | number | null;
  sku?: string | number | null;
  name?: string | null;
  price?: number | string | null;
  unitPrice?: number | string | null;
  url?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  availability?: string | null;
};

const BASE_URL = 'https://www.vitusapotek.no';

export const vitusapotekNoConnector = {
  chain: 'vitusapotek',
  country: 'NO',
  currency: 'NOK',
  source: BASE_URL
} as const;

function parseNumber(value: number | string | null | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value) return null;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(url: string | null | undefined) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

export function buildVitusapotekNoSearchUrl(query: string) {
  return `${BASE_URL}/search?text=${encodeURIComponent(query)}`;
}

export function normalizeVitusapotekNoProduct(raw: VitusapotekNoRawProduct, observedAt = new Date().toISOString()): VitusapotekNoProduct {
  const id = String(raw.id ?? raw.sku ?? raw.url ?? raw.name ?? '').trim();
  const name = String(raw.name ?? '').trim();

  if (!id || !name) {
    throw new Error('Vitusapotek product requires id and name');
  }

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'vitusapotek',
    id,
    name,
    price: parseNumber(raw.price),
    unitPrice: parseNumber(raw.unitPrice),
    url: absoluteUrl(raw.url),
    imageUrl: absoluteUrl(raw.imageUrl ?? raw.image) || null,
    availability: raw.availability ?? null,
    observedAt
  };
}

export function vitusapotekNoJsonLdToProduct(jsonLd: Record<string, unknown>, observedAt = new Date().toISOString()) {
  const offers = typeof jsonLd.offers === 'object' && jsonLd.offers !== null ? jsonLd.offers as Record<string, unknown> : {};
  return normalizeVitusapotekNoProduct(
    {
      id: jsonLd.sku as string | number | null | undefined,
      name: jsonLd.name as string | null | undefined,
      price: offers.price as string | number | null | undefined,
      url: jsonLd.url as string | null | undefined,
      image: Array.isArray(jsonLd.image) ? jsonLd.image[0] as string | null | undefined : jsonLd.image as string | null | undefined,
      availability: offers.availability as string | null | undefined
    },
    observedAt
  );
}
