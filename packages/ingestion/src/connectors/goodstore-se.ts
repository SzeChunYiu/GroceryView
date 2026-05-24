export type GoodstoreSeChannel = 'online' | 'store';

export type GoodstoreSeMultiBuy = {
  buy_quantity: number;
  save_amount: number;
  currency: 'SEK';
};

export type GoodstoreSePriceRow = {
  chain: 'Goodstore';
  country: 'SE';
  currency: 'SEK';
  product_name: string;
  price: number;
  channel: GoodstoreSeChannel;
  store_id: string;
  region: 'stockholm' | 'se';
  source_url: string;
  retrieved_at: string;
  is_member_price: boolean;
  is_coupon_price: boolean;
  is_subscription_price: false;
  is_clearance: false;
  member_program?: 'Goodfriends';
  member_discount_percent?: 3 | 10;
  member_threshold_sek?: 1000;
  online_delivery_fee_sek?: 79.95;
  online_free_shipping_threshold_sek?: 999;
  online_minimum_order_sek?: 300;
  multi_buy?: GoodstoreSeMultiBuy;
};

export type FetchGoodstoreSeOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

export const GOODSTORE_SE_BASE_URL = 'https://www.goodstore.se';
export const GOODSTORE_SE_START_URL = 'https://www.goodstore.se/';
export const GOODSTORE_SE_STORE_ID = 'goodstore-se-stockholm-asogatan-116';
export const GOODSTORE_SE_ONLINE_DELIVERY_FEE_SEK = 79.95;
export const GOODSTORE_SE_FREE_SHIPPING_THRESHOLD_SEK = 999;
export const GOODSTORE_SE_MINIMUM_ORDER_SEK = 300;

export async function fetchGoodstoreSePrices(options: FetchGoodstoreSeOptions = {}): Promise<GoodstoreSePriceRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? GOODSTORE_SE_START_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`Goodstore request failed: ${response.status}`);
  return parseGoodstoreSePrices(await response.text(), sourceUrl, retrievedAt).slice(0, options.maxRows ?? Number.POSITIVE_INFINITY);
}

export function parseGoodstoreSePrices(html: string, sourceUrl = GOODSTORE_SE_START_URL, retrievedAt = new Date().toISOString()): GoodstoreSePriceRow[] {
  const rows: GoodstoreSePriceRow[] = [];
  const seen = new Set<string>();
  for (const baseRow of parseBaseRows(html, sourceUrl, retrievedAt)) {
    for (const row of expandGoodfriendsRows(baseRow)) {
      const key = `${row.product_name}:${row.channel}:${row.price}:${row.is_member_price}:${row.member_discount_percent ?? 0}:${row.multi_buy?.buy_quantity ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }
  return rows;
}

function parseBaseRows(html: string, sourceUrl: string, retrievedAt: string): GoodstoreSePriceRow[] {
  const rows: GoodstoreSePriceRow[] = [];
  const blocks = html.split(/<(?=article|li|section|div\b|h[1-4]\b)/gi);
  for (const block of blocks) {
    const productName = extractProductName(block);
    const price = extractSekPrice(block);
    if (!productName || price === null) continue;
    const channel = storeOnly(block) ? 'store' : 'online';
    rows.push({
      chain: 'Goodstore',
      country: 'SE',
      currency: 'SEK',
      product_name: productName,
      price,
      channel,
      store_id: channel === 'store' ? GOODSTORE_SE_STORE_ID : 'goodstore-se-webshop',
      region: channel === 'store' ? 'stockholm' : 'se',
      source_url: sourceUrl,
      retrieved_at: retrievedAt,
      is_member_price: false,
      is_coupon_price: false,
      is_subscription_price: false,
      is_clearance: false,
      online_delivery_fee_sek: channel === 'online' ? GOODSTORE_SE_ONLINE_DELIVERY_FEE_SEK : undefined,
      online_free_shipping_threshold_sek: channel === 'online' ? GOODSTORE_SE_FREE_SHIPPING_THRESHOLD_SEK : undefined,
      online_minimum_order_sek: channel === 'online' ? GOODSTORE_SE_MINIMUM_ORDER_SEK : undefined,
      multi_buy: extractMultiBuy(productName)
    });
  }
  return rows;
}

export function expandGoodfriendsRows(row: GoodstoreSePriceRow): GoodstoreSePriceRow[] {
  if (row.multi_buy) return [row];
  return [row, makeGoodfriendsRow(row, 3), makeGoodfriendsRow(row, 10)];
}

function makeGoodfriendsRow(row: GoodstoreSePriceRow, discount: 3 | 10): GoodstoreSePriceRow {
  return {
    ...row,
    price: roundSek(row.price * (1 - discount / 100)),
    is_member_price: true,
    is_coupon_price: row.channel === 'online',
    member_program: 'Goodfriends',
    member_discount_percent: discount,
    member_threshold_sek: 1000
  };
}

function extractProductName(block: string): string {
  const heading = block.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i)?.[1];
  const alt = block.match(/alt=["']([^"']+)["']/i)?.[1];
  const title = block.match(/title=["']([^"']+)["']/i)?.[1];
  return cleanName(heading ?? alt ?? title ?? '');
}

function extractSekPrice(block: string): number | null {
  const match = block.match(/([0-9]+(?:[\s.]?[0-9]{3})*(?:[,.:][0-9]{1,2})?)\s*SEK/i);
  return numberOrNull(match?.[1]);
}

function extractMultiBuy(productName: string): GoodstoreSeMultiBuy | undefined {
  const match = productName.match(/KÖP\s+(\d+)\s+SPARA\s+([0-9]+)\s*KR/i);
  if (!match) return undefined;
  return { buy_quantity: Number(match[1]), save_amount: Number(match[2]), currency: 'SEK' };
}

function storeOnly(block: string): boolean {
  return /endast i butik|finns endast i (?:vår )?goodstorebutik|Åsögatan 116/i.test(decodeHtml(stripHtml(block)));
}

function cleanName(value: string): string {
  return decodeHtml(stripHtml(value)).replace(/\s+/g, ' ').replace(/\s*[–-]\s*Läs mer.*$/i, '').trim();
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, ' ');
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function numberOrNull(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').replace(/\.(?=\d{3}(?:\D|$))/g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundSek(value: number): number {
  return Math.round(value * 100) / 100;
}
