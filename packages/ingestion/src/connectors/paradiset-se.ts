export const PARADISET_SE_BASE_URL = 'https://www.paradiset.com';
export const PARADISET_SE_OPENING_SOURCE_URL =
  'https://www.mynewsdesk.com/se/paradiset/pressreleases/nu-oeppnar-skandinaviens-stoersta-ekobutik-1300783';
export const PARADISET_SE_CROWDFUNDING_SOURCE_URL =
  'https://www.mynewsdesk.com/se/paradiset/pressreleases/vaerldens-foersta-crowdfunding-foer-en-matvarukedja-paradiset-fortsaetter-att-utmana-den-svenska-dagligvaruhandeln-2143246';
export const PARADISET_SE_INVESTOR_DISCOUNT_SOURCE_URL =
  'https://www.mynewsdesk.com/se/paradiset/news/paradiset-blir-aarets-haallbara-foeregaangare-2018-av-white-guide-green-308438';

export const PARADISET_SE_BRANNKYRKAGATAN_STORE_ID = 'paradiset-se-stockholm-brannkyrkagatan-62';
export const PARADISET_SE_SICKLA_STORE_ID = 'paradiset-se-stockholm-sickla';
export const PARADISET_SE_REGERINGSGATAN_STORE_ID = 'paradiset-se-stockholm-regeringsgatan';

export type ParadisetSeChannel = 'online' | 'store' | 'counter';
export type ParadisetSeFormat = 'organic_market';
export type ParadisetSeStoreId =
  | typeof PARADISET_SE_BRANNKYRKAGATAN_STORE_ID
  | typeof PARADISET_SE_SICKLA_STORE_ID
  | typeof PARADISET_SE_REGERINGSGATAN_STORE_ID
  | null;

export type ParadisetSePriceRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'paradiset-se';
  code: string;
  name: string;
  category: string;
  price: number;
  priceText: string;
  unitPrice: number | null;
  unitPriceUnit: string;
  channel: ParadisetSeChannel;
  format: ParadisetSeFormat;
  store_id: ParadisetSeStoreId;
  region: 'stockholm' | null;
  sourceDiscountTier: 'ordinary' | 'owner_20_percent_store' | 'owner_10_percent_online';
  is_member_price: boolean;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  multi_buy: null;
  membershipProgram: 'Paradiset delagare' | null;
  membershipDiscountPercent: 20 | 10 | null;
  productUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchParadisetSeProductsOptions = {
  fetchImpl?: typeof fetch;
  productUrls?: readonly string[];
  retrievedAt?: string;
  defaultChannel?: ParadisetSeChannel;
  defaultStoreId?: ParadisetSeStoreId;
  includeOwnerDiscountRows?: boolean;
};

export async function fetchParadisetSeProducts(options: FetchParadisetSeProductsOptions = {}): Promise<ParadisetSePriceRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const productUrls = options.productUrls ?? [];
  const rows: ParadisetSePriceRow[] = [];

  for (const productUrl of productUrls) {
    const response = await fetchImpl(productUrl, {
      headers: {
        accept: 'text/html',
        'user-agent': 'GroceryView/0.1 paradiset-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Paradiset SE product request failed with HTTP ${response.status}.`);
    rows.push(
      ...parseParadisetSeProductHtml(await response.text(), productUrl, retrievedAt, {
        defaultChannel: options.defaultChannel,
        defaultStoreId: options.defaultStoreId,
        includeOwnerDiscountRows: options.includeOwnerDiscountRows
      })
    );
  }

  return rows;
}

export function parseParadisetSeProductHtml(
  html: string,
  productUrl: string,
  retrievedAt: string,
  options: {
    defaultChannel?: ParadisetSeChannel;
    defaultStoreId?: ParadisetSeStoreId;
    includeOwnerDiscountRows?: boolean;
  } = {}
): ParadisetSePriceRow[] {
  const text = htmlToText(html);
  const name = productName(html, text);
  const price = money(text.match(/(?:pris|price)?\s*(\d+(?:[,.]\d{1,2})?)\s*(?:SEK|kr|:-)/i)?.[1]);
  if (!name || price === null) return [];

  const channel = channelFromText(text, options.defaultChannel ?? 'online');
  const storeId = storeIdFromText(text, options.defaultStoreId ?? null);
  const unitPrice = money(text.match(/(?:jmf|jamforpris|jämförpris|unit price)[^\d]*(\d+(?:[,.]\d{1,2})?)/i)?.[1]);
  const baseRow: ParadisetSePriceRow = {
    country: 'SE',
    currency: 'SEK',
    chain: 'paradiset-se',
    code: text.match(/(?:art\.?\s*nr|sku|artikelnummer)[:\s]*([A-Za-z0-9_-]+)/i)?.[1] ?? slugFromUrl(productUrl),
    name,
    category: categoryFromUrl(productUrl),
    price,
    priceText: `${formatSek(price)} SEK`,
    unitPrice,
    unitPriceUnit: unitPrice === null ? '' : 'SEK comparable unit',
    channel,
    format: 'organic_market',
    store_id: storeId,
    region: storeId === null ? null : 'stockholm',
    sourceDiscountTier: 'ordinary',
    is_member_price: false,
    is_subscription_price: false,
    is_coupon_price: false,
    is_clearance: false,
    multi_buy: null,
    membershipProgram: null,
    membershipDiscountPercent: null,
    productUrl,
    sourceUrl: productUrl,
    retrievedAt
  };

  return options.includeOwnerDiscountRows ? [baseRow, ownerDiscountRow(baseRow)] : [baseRow];
}

export function ownerDiscountRow(row: ParadisetSePriceRow): ParadisetSePriceRow {
  const discountPercent = row.channel === 'online' ? 10 : 20;
  const discountedPrice = roundSek(row.price * (1 - discountPercent / 100));
  return {
    ...row,
    code: `${row.code}-paradiset-delagare-${discountPercent}`,
    price: discountedPrice,
    priceText: `${formatSek(discountedPrice)} SEK`,
    sourceDiscountTier: discountPercent === 10 ? 'owner_10_percent_online' : 'owner_20_percent_store',
    is_member_price: true,
    membershipProgram: 'Paradiset delagare',
    membershipDiscountPercent: discountPercent
  };
}

function channelFromText(text: string, fallback: ParadisetSeChannel): ParadisetSeChannel {
  if (/delikatessdisk|fiskdisk|ostdisk|charkdisk|foodcourt/i.test(text)) return 'counter';
  if (/butik|brannkyrkagatan|brännkyrkagatan|sickla|regeringsgatan/i.test(text)) return 'store';
  if (/online|natet|nätet|webb|webshop|e-handel/i.test(text)) return 'online';
  return fallback;
}

function storeIdFromText(text: string, fallback: ParadisetSeStoreId): ParadisetSeStoreId {
  if (/brannkyrkagatan|brännkyrkagatan|mariatorget/i.test(text)) return PARADISET_SE_BRANNKYRKAGATAN_STORE_ID;
  if (/sickla/i.test(text)) return PARADISET_SE_SICKLA_STORE_ID;
  if (/regeringsgatan|mäster samuelsgatan|master samuelsgatan/i.test(text)) return PARADISET_SE_REGERINGSGATAN_STORE_ID;
  return fallback;
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
    .replace(/\s+/g, ' ')
    .trim();
}

function productName(html: string, text: string): string {
  const heading = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  const headingText = heading ? htmlToText(heading) : '';
  return headingText || text.split(/[.!?]/).find((line) => line.trim().length > 0)?.trim() || '';
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
  return new URL(url).pathname.split('/').filter(Boolean).at(-1)?.replace(/\.html$/, '') ?? 'paradiset-product';
}

function categoryFromUrl(url: string): string {
  return new URL(url).pathname.split('/').filter(Boolean).at(-2) ?? 'paradiset';
}
