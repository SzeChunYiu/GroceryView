export const GOODSTORE_SE_BASE_URL = 'https://www.goodstore.se';
export const GOODSTORE_SE_HOME_URL = `${GOODSTORE_SE_BASE_URL}/`;
export const GOODSTORE_SE_TERMS_URL = `${GOODSTORE_SE_BASE_URL}/villkor-info.html`;
export const GOODSTORE_SE_GOODFRIENDS_URL = `${GOODSTORE_SE_BASE_URL}/goodfriends.html`;
export const GOODSTORE_SE_STORE_ID = 'goodstore-se-stockholm-asogatan-116';

export type GoodstoreSeChannel = 'online' | 'store';
export type GoodstoreSeFormat = 'single_store_webshop';

export type GoodstoreSePriceRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'goodstore-se';
  code: string;
  name: string;
  category: string;
  price: number;
  priceText: string;
  unitPrice: number | null;
  unitPriceUnit: string;
  channel: GoodstoreSeChannel;
  format: GoodstoreSeFormat;
  store_id: typeof GOODSTORE_SE_STORE_ID;
  storeName: 'Goodstore Åsögatan 116';
  region: 'stockholm';
  deliveryFeeSek: number | null;
  freeShippingThresholdSek: number | null;
  minimumOrderSek: number | null;
  is_member_price: boolean;
  is_subscription_price: false;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: string | null;
  membershipProgram: 'Goodfriends' | null;
  membershipDiscountPercent: number | null;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchGoodstoreSeProductsOptions = {
  fetchImpl?: typeof fetch;
  productUrls?: readonly string[];
  retrievedAt?: string;
  includeMemberPriceRows?: boolean;
};

const PRICE_RE = /(\d+(?:[,.]\d{1,2})?)\s*(?:SEK|kr)/i;
const ARTICLE_RE = /Art\.nr:\s*([A-Za-z0-9_-]+)/i;

export async function fetchGoodstoreSeProducts(options: FetchGoodstoreSeProductsOptions = {}): Promise<GoodstoreSePriceRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const urls = options.productUrls ?? [];
  const rows: GoodstoreSePriceRow[] = [];
  for (const productUrl of urls) {
    const response = await fetchImpl(productUrl, {
      headers: {
        accept: 'text/html',
        'user-agent': 'GroceryView/0.1 goodstore-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Goodstore SE product request failed with HTTP ${response.status}.`);
    rows.push(...parseGoodstoreSeProductHtml(await response.text(), productUrl, retrievedAt, { includeMemberPriceRows: options.includeMemberPriceRows }));
  }
  return rows;
}

export function parseGoodstoreSeProductHtml(
  html: string,
  productUrl: string,
  retrievedAt: string,
  options: { includeMemberPriceRows?: boolean } = {}
): GoodstoreSePriceRow[] {
  const text = htmlToText(html);
  const name = productName(html, text);
  const bodyText = text.split('\n').slice(1).join('\n');
  const price = money(bodyText.match(PRICE_RE)?.[1] ?? text.match(PRICE_RE)?.[1]);
  if (!name || price === null) return [];
  const storeOnly = /Endast i butik|Endast i butiken på Åsögatan 116/i.test(text);
  const code = text.match(ARTICLE_RE)?.[1] ?? slugFromUrl(productUrl);
  const unitPrice = money(text.match(/Jmf pris SEK\s*(\d+(?:[,.]\d{1,2})?)/i)?.[1]);
  const baseRow: GoodstoreSePriceRow = {
    country: 'SE',
    currency: 'SEK',
    chain: 'goodstore-se',
    code,
    name,
    category: categoryFromUrl(productUrl),
    price,
    priceText: `${formatSek(price)} SEK`,
    unitPrice,
    unitPriceUnit: unitPrice === null ? '' : 'SEK comparable unit',
    channel: storeOnly ? 'store' : 'online',
    format: 'single_store_webshop',
    store_id: GOODSTORE_SE_STORE_ID,
    storeName: 'Goodstore Åsögatan 116',
    region: 'stockholm',
    deliveryFeeSek: storeOnly ? null : 79.95,
    freeShippingThresholdSek: storeOnly ? null : 999,
    minimumOrderSek: storeOnly ? null : 300,
    is_member_price: false,
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    multi_buy: multiBuyFromName(name),
    membershipProgram: null,
    membershipDiscountPercent: null,
    productUrl,
    sourceUrl: productUrl,
    retrievedAt
  };
  return options.includeMemberPriceRows ? [baseRow, memberPriceRow(baseRow, 3)] : [baseRow];
}

export function memberPriceRow(row: GoodstoreSePriceRow, discountPercent: 3 | 10): GoodstoreSePriceRow {
  const discountedPrice = roundSek(row.price * (1 - discountPercent / 100));
  return {
    ...row,
    code: `${row.code}-goodfriends-${discountPercent}`,
    price: discountedPrice,
    priceText: `${formatSek(discountedPrice)} SEK`,
    is_member_price: true,
    is_coupon_price: true,
    membershipProgram: 'Goodfriends',
    membershipDiscountPercent: discountPercent
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function productName(html: string, text: string): string {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const headingText = heading ? htmlToText(heading) : '';
  return headingText || text.split('\n').find((line) => line.trim().length > 0)?.trim() || '';
}

function money(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? roundSek(parsed) : null;
}

function roundSek(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function formatSek(value: number): string {
  return value.toFixed(2).replace('.', ',');
}

function slugFromUrl(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-1)?.replace(/\.html$/, '') ?? 'goodstore-product';
}

function categoryFromUrl(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-2) ?? 'goodstore';
}

function multiBuyFromName(name: string): string | null {
  const match = name.match(/KÖP\s*(\d+)\s*SPARA\s*(\d+)\s*KR/i);
  return match ? `buy_${match[1]}_save_${match[2]}_sek` : null;
}
