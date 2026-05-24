export const MAC_SE_BASE_URL = 'https://www.maccosmetics.se';

export type MacSeProduct = {
  country: 'SE';
  currency: 'SEK';
  chain: 'mac-cosmetics';
  retailer_type: 'cosmetics';
  code: string;
  name: string;
  brand: 'MAC Cosmetics';
  category: 'cosmetics';
  price: number;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export function parseMacSeProducts(html: string, sourceUrl: string, retrievedAt: string): MacSeProduct[] {
  const rows: MacSeProduct[] = [];
  for (const json of extractJsonLd(html)) {
    const products = Array.isArray(json) ? json : [json];
    for (const item of products) {
      const product = item as Record<string, unknown>;
      if (product['@type'] !== 'Product') continue;
      const offers = product.offers as Record<string, unknown> | undefined;
      const price = numberValue(offers?.price);
      const name = text(product.name);
      if (!name || price === null) continue;
      const url = absoluteUrl(text(product.url) || sourceUrl);
      rows.push({
        country: 'SE',
        currency: 'SEK',
        chain: 'mac-cosmetics',
        retailer_type: 'cosmetics',
        code: text(product.sku) || slug(name),
        name,
        brand: 'MAC Cosmetics',
        category: 'cosmetics',
        price,
        productUrl: url,
        imageUrl: absoluteUrl(Array.isArray(product.image) ? text(product.image[0]) : text(product.image)),
        sourceUrl,
        retrievedAt
      });
    }
  }
  return rows;
}

function extractJsonLd(html: string): unknown[] {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return blocks.flatMap((block) => {
    try {
      return [JSON.parse(block[1].trim()) as unknown];
    } catch {
      return [];
    }
  });
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function numberValue(value: unknown): number | null {
  const parsed = Number.parseFloat(text(value).replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function absoluteUrl(value: string): string {
  if (!value) return '';
  return new URL(value, MAC_SE_BASE_URL).toString();
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}
