import { isEthnicAfricanOverlapCategory, type EthnicAfricanOverlapCategory } from './overlapCategories.js';

export type AfroshopSeLocation = {
  locationId: string;
  name: string;
  city: string;
  address: string;
  sourceUrl: string;
};

export type AfroshopSeProductRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'afroshop';
  retailer_type: 'ethnic_african';
  productId: string;
  name: string;
  category: EthnicAfricanOverlapCategory;
  price: number;
  priceText: string;
  packageText: string;
  productUrl: string;
  imageUrl: string;
  locations: AfroshopSeLocation[];
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchAfroshopSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl: string;
  retrievedAt?: string;
};

export const AFROSHOP_SE_LOCATIONS: AfroshopSeLocation[] = [
  {
    locationId: 'linkoping-ey-afroshop',
    name: 'Linköping E&Y Afroshop',
    city: 'Linköping',
    address: 'Sturegatan 3a, 582 21 Linköping',
    sourceUrl: 'https://www.allbiz.se/link%C3%B6ping-e-y-afroshop-afro-butik-072-206-84-48'
  },
  {
    locationId: 'nassjo-likhayas-butik',
    name: 'Afroshop i Nässjö - Likhayas Butik',
    city: 'Nässjö',
    address: 'Köpmansgatan 4, 571 31 Nässjö',
    sourceUrl: 'https://www.allbiz.se/afroshop-i-n%C3%A4ssj%C3%B6-likhayas-butik-073-342-87-46'
  },
  {
    locationId: 'malmo-gods-gift',
    name: 'Gods Gift Afro Shop and Beauty Center',
    city: 'Malmö',
    address: 'Östra Förstadsgatan 35 A, 212 12 Malmö',
    sourceUrl: 'https://www.merinfo.se/foretag/GODS-GIFT-AFRO-SHOP-AND-BEAUTY-CENTER-771027-XXXX/5uvuapy9eac0-1hlgg'
  }
];

export async function fetchAfroshopSeProducts(options: FetchAfroshopSeProductsOptions): Promise<AfroshopSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(options.sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion (+https://groceryview.example)'
    }
  });
  if (!response.ok) {
    throw new Error(`Afroshop SE request failed for ${options.sourceUrl}: ${response.status}`);
  }
  return parseAfroshopSeProducts(await response.text(), options.sourceUrl, options.retrievedAt ?? new Date().toISOString());
}

export function parseAfroshopSeProducts(html: string, sourceUrl: string, retrievedAt = new Date().toISOString()): AfroshopSeProductRow[] {
  const rows: AfroshopSeProductRow[] = [];
  const seen = new Set<string>();
  const productPattern = /<(?:article|li|div)\b(?=[^>]*(?:data-afroshop-product|class="[^"]*\bproduct\b))(?<attrs>[^>]*)>(?<body>[\s\S]*?)<\/(?:article|li|div)>/gi;
  for (const match of html.matchAll(productPattern)) {
    const attrs = match.groups?.attrs ?? '';
    const body = match.groups?.body ?? '';
    const category = categoryFrom(attrs, body);
    if (!category) continue;
    const price = priceFrom(body);
    const name = productNameFrom(body);
    if (!name || price === null) continue;
    const productUrl = absoluteUrl(attribute(body, 'href'), sourceUrl);
    const productId = text(attribute(attrs, 'data-product-id')) || slug(name);
    if (seen.has(productId)) continue;
    seen.add(productId);
    rows.push({
      country: 'SE',
      currency: 'SEK',
      chain: 'afroshop',
      retailer_type: 'ethnic_african',
      productId,
      name,
      category,
      price,
      priceText: `${formatSek(price)} SEK`,
      packageText: text(classText(body, 'package')) || text(attribute(attrs, 'data-package')),
      productUrl,
      imageUrl: absoluteUrl(attribute(body, 'src'), sourceUrl),
      locations: AFROSHOP_SE_LOCATIONS,
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

function categoryFrom(attrs: string, body: string): EthnicAfricanOverlapCategory | null {
  const candidate = text(attribute(attrs, 'data-category')) || text(classText(body, 'category'));
  const normalized = candidate.trim().toLowerCase();
  return isEthnicAfricanOverlapCategory(normalized) ? normalized : null;
}

function productNameFrom(body: string) {
  return text(classText(body, 'name') || classText(body, 'woocommerce-loop-product__title') || body.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1]);
}

function priceFrom(body: string) {
  const value = text(classText(body, 'price') || body);
  const match = value.match(/([0-9]+(?:[,.][0-9]+)?)\s*(?:kr|sek)/i);
  if (!match) return null;
  const parsed = Number.parseFloat((match[1] ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function attribute(value: string, name: string) {
  return value.match(new RegExp(`${name}="([^"]*)"`, 'i'))?.[1] ?? '';
}

function classText(html: string, className: string) {
  return html.match(new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'))?.[1] ?? '';
}

function text(value: unknown) {
  return decodeHtml(String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function slug(value: string) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function absoluteUrl(value: string, sourceUrl: string) {
  if (!value) return '';
  return new URL(value, sourceUrl).toString();
}

function formatSek(value: number) {
  return value.toFixed(2).replace(/\.00$/, '');
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}
