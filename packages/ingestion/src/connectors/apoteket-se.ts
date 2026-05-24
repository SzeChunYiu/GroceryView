export type ApoteketSePriceChannel = 'online' | 'store' | 'counter' | 'packaged';

export type ApoteketSeMultiBuy = {
  quantity: number;
  discountPercent: number;
  text: string;
};

export type ApoteketSePriceRow = {
  chain: 'apoteket-se';
  countryCode: 'SE';
  productId: string;
  sku: string;
  gtin: string;
  name: string;
  brand: string;
  category: string;
  channel: ApoteketSePriceChannel;
  price: number;
  currency: 'SEK';
  regularPrice: number | null;
  unitPriceText: string;
  format: string | null;
  storeId: string | null;
  regionTag: string | null;
  is_member_price: boolean;
  is_subscription_price: boolean;
  is_coupon_price: boolean;
  is_clearance: boolean;
  multi_buy: ApoteketSeMultiBuy | null;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchApoteketSeProductsOptions = {
  fetchImpl?: typeof fetch;
  productUrls: readonly string[];
  retrievedAt?: string;
};

type JsonLdProduct = {
  name?: unknown;
  category?: unknown;
  gtin?: unknown;
  productID?: unknown;
  sku?: unknown;
  brand?: { name?: unknown } | string;
  offers?: {
    url?: unknown;
    price?: unknown;
    priceCurrency?: unknown;
    priceSpecification?: { price?: unknown };
  };
};

export const APOTEKET_SE_BASE_URL = 'https://www.apoteket.se';

export async function fetchApoteketSeProductPrices(options: FetchApoteketSeProductsOptions): Promise<ApoteketSePriceRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: ApoteketSePriceRow[] = [];
  for (const productUrl of options.productUrls) {
    const response = await fetchImpl(productUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView ingestion (+https://groceryview.example)'
      }
    });
    if (!response.ok) {
      throw new Error(`Apoteket SE product request failed for ${productUrl}: ${response.status}`);
    }
    rows.push(...parseApoteketSeProductPage(await response.text(), productUrl, retrievedAt));
  }
  return rows;
}

export function parseApoteketSeProductPage(html: string, sourceUrl: string, retrievedAt = new Date().toISOString()): ApoteketSePriceRow[] {
  const product = productJsonLd(html);
  if (!product) return [];

  const onlinePrice = numberFromText(product.offers?.price);
  const onlineRegularPrice = numberFromText(product.offers?.priceSpecification?.price);
  const storePrice = storePriceFromHtml(html);
  const unitPriceText = unitPriceFromHtml(html);
  const clean = text(html);
  const multiBuy = multiBuyFromText(clean);
  const is_member_price = /\bmedlem(?:spris|serbjudande)?\b/i.test(clean);
  const is_coupon_price = /\bkod\s*:/i.test(clean);
  const common = {
    chain: 'apoteket-se' as const,
    countryCode: 'SE' as const,
    productId: textValue(product.productID),
    sku: textValue(product.sku),
    gtin: textValue(product.gtin),
    name: textValue(product.name),
    brand: typeof product.brand === 'string' ? product.brand : textValue(product.brand?.name),
    category: textValue(product.category),
    currency: 'SEK' as const,
    regularPrice: onlineRegularPrice,
    unitPriceText,
    format: null,
    storeId: null,
    regionTag: null,
    is_member_price,
    is_subscription_price: false,
    is_coupon_price,
    is_clearance: false,
    multi_buy: multiBuy,
    productUrl: absoluteUrl(textValue(product.offers?.url) || sourceUrl),
    sourceUrl,
    retrievedAt
  };

  const rows: ApoteketSePriceRow[] = [];
  if (onlinePrice !== null) {
    rows.push({
      ...common,
      channel: 'online',
      price: onlinePrice
    });
  }
  if (storePrice !== null) {
    rows.push({
      ...common,
      channel: 'store',
      price: storePrice,
      regularPrice: null
    });
  }
  return rows;
}

function productJsonLd(html: string): JsonLdProduct | null {
  const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const script of scripts) {
    try {
      const parsed = JSON.parse(decodeHtml(script[1] ?? '')) as JsonLdProduct;
      if (parsed && parsed['@type' as keyof JsonLdProduct] === 'Product') return parsed;
    } catch {
      // Ignore non-product JSON-LD blocks.
    }
  }
  return null;
}

function storePriceFromHtml(html: string) {
  const match = text(html).match(/Butikspris:\s*([0-9]+(?:[,.][0-9]+)?)/i);
  return match ? numberFromText(match[1]) : null;
}

function unitPriceFromHtml(html: string) {
  return text(html).match(/Jmfs\.pris:\s*([^K]+kr\s*\/\s*[\p{L}]+)/iu)?.[1]?.trim() ?? '';
}

function multiBuyFromText(value: string): ApoteketSeMultiBuy | null {
  const match = value.match(/(\d+(?:[,.]\d+)?)\s*%\s*vid köp av\s*(\d+)/i);
  if (!match) return null;
  const discountPercent = numberFromText(match[1]);
  const quantity = Number.parseInt(match[2] ?? '', 10);
  if (discountPercent === null || !Number.isFinite(quantity)) return null;
  return {
    quantity,
    discountPercent,
    text: match[0]
  };
}

function numberFromText(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function textValue(value: unknown) {
  return String(value ?? '').trim();
}

function text(value: string) {
  return decodeHtml(value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function absoluteUrl(value: string) {
  if (!value) return APOTEKET_SE_BASE_URL;
  return new URL(value, APOTEKET_SE_BASE_URL).toString();
}

function decodeHtml(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#39;/g, "'");
}
