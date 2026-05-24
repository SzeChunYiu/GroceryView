export type ApotekidIsProduct = {
  availability?: string;
  currency: 'ISK';
  id: string;
  name: string;
  price: number;
  url: string;
};

type ApotekidIsJsonLdOffer = {
  availability?: string;
  price?: number | string;
  priceCurrency?: string;
  url?: string;
};

type ApotekidIsJsonLdProduct = {
  '@type'?: string | string[];
  name?: string;
  offers?: ApotekidIsJsonLdOffer | ApotekidIsJsonLdOffer[];
  sku?: string;
  url?: string;
};

export const apotekidIsConnector = {
  id: 'apotekid-is',
  country: 'IS',
  chain: 'Apótekið',
  baseUrl: 'https://www.apotekid.is',
  currency: 'ISK'
} as const;

export function parseApotekidIsProductJsonLd(input: ApotekidIsJsonLdProduct): ApotekidIsProduct | null {
  if (!isProduct(input) || !input.name) {
    return null;
  }

  const offer = Array.isArray(input.offers) ? input.offers[0] : input.offers;
  const price = normalizeApotekidIsPrice(offer?.price);
  if (price === null) {
    return null;
  }

  const url = offer?.url ?? input.url ?? apotekidIsConnector.baseUrl;

  return {
    availability: offer?.availability,
    currency: 'ISK',
    id: input.sku ?? slugify(input.name),
    name: input.name,
    price,
    url: url.startsWith('http') ? url : new URL(url, apotekidIsConnector.baseUrl).toString()
  };
}

export function normalizeApotekidIsPrice(value: number | string | undefined): number | null {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (!value) {
    return null;
  }
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  const price = Number(normalized);
  return Number.isFinite(price) ? price : null;
}

function isProduct(input: ApotekidIsJsonLdProduct): boolean {
  return Array.isArray(input['@type']) ? input['@type'].includes('Product') : input['@type'] === 'Product';
}

function slugify(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
