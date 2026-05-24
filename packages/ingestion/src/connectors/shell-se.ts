import { createHash } from 'node:crypto';

export const SHELL_SE_LIGHT_LIST_PRICE_URL = 'https://st1.se/foretag/listpris';
export const SHELL_SE_TRUCK_LIST_PRICE_URL = 'https://st1.se/foretag/listpris-truck';
export const SHELL_SE_MOBILITY_URL = 'https://st1.se/app-och-erbjudanden/st1-mobility';
export const SHELL_SE_BONUSTIAN_URL = 'https://st1.se/privat/bonustian-kampanj';
export const SHELL_SE_PLOQ_URL = 'https://ploq.se/';
export const SHELL_SE_CAR_WASH_STOCKHOLM_URL = 'https://st1.se/privat/tjanster/biltvatt/biltvatt-stockholm';

export type ShellSeChannel = 'store' | 'online' | 'counter' | 'packaged';
export type ShellSeFormat = 'st1-station' | 'st1-truck' | 'ploq' | 'st1-car-wash';

export type ShellSePriceRow = {
  id: string;
  chain_id: 'shell-se';
  operator: 'St1 Sverige AB';
  product_id: string;
  name: string;
  category: 'fuel' | 'food' | 'car_wash' | 'voucher';
  price?: number;
  regular_price?: number;
  currency: 'SEK';
  unit: 'litre' | 'item' | 'month' | 'promotion';
  channel: ShellSeChannel;
  format: ShellSeFormat;
  store_id: { id: string; region: 'SE-national' | 'SE-Stockholm' };
  valid_from?: string;
  source_url: string;
  source_digest?: string;
  is_member_price?: boolean;
  is_subscription_price?: boolean;
  is_coupon_price?: boolean;
  is_clearance?: boolean;
  discount_percent?: number;
  multi_buy?: Array<{ minimum_quantity: number; reward_value: number; reward_unit: 'SEK'; maximum_quantity?: number }>;
};

const LIGHT_FUEL_LABELS = ['Bensin 98', 'Bensin 95', 'E85', 'Diesel', 'HVO100'] as const;
const TRUCK_FUEL_LABELS = ['LBG', 'Diesel', 'HVO100', 'AdBlue'] as const;

type FuelLabel = typeof LIGHT_FUEL_LABELS[number] | typeof TRUCK_FUEL_LABELS[number];

export function parseShellSeFuelListHtml(html: string, options: { sourceUrl: string; capturedAt?: string }): ShellSePriceRow[] {
  const text = decodeHtmlText(html);
  const validFrom = parseSwedishValidFrom(text);
  const labels = options.sourceUrl.includes('listpris-truck') ? TRUCK_FUEL_LABELS : LIGHT_FUEL_LABELS;
  const format: ShellSeFormat = options.sourceUrl.includes('listpris-truck') ? 'st1-truck' : 'st1-station';
  const digest = createHash('sha256').update(html).digest('hex');

  return labels.map((label) => ({
    id: `shell-se-${format}-${slug(label)}-${validFrom.slice(0, 10)}`,
    chain_id: 'shell-se',
    operator: 'St1 Sverige AB',
    product_id: slug(label),
    name: label,
    category: 'fuel',
    price: priceForLabel(text, label),
    currency: 'SEK',
    unit: 'litre',
    channel: 'store',
    format,
    store_id: { id: 'SE', region: 'SE-national' },
    valid_from: validFrom,
    source_url: options.sourceUrl,
    source_digest: digest
  }));
}

export const SHELL_SE_STATIC_QUIRK_ROWS: ShellSePriceRow[] = [
  {
    id: 'shell-se-ploq-weekly-app-fika',
    chain_id: 'shell-se',
    operator: 'St1 Sverige AB',
    product_id: 'ploq-weekly-app-fika',
    name: 'PLOQ weekly App-fika',
    category: 'food',
    price: 10,
    currency: 'SEK',
    unit: 'item',
    channel: 'store',
    format: 'ploq',
    store_id: { id: 'SE', region: 'SE-national' },
    source_url: SHELL_SE_PLOQ_URL,
    is_coupon_price: true
  },
  {
    id: 'shell-se-ploq-kids-meal-summer-app',
    chain_id: 'shell-se',
    operator: 'St1 Sverige AB',
    product_id: 'ploq-kids-meal-summer-app',
    name: 'PLOQ children meal summer St1 Mobility price',
    category: 'food',
    price: 27,
    regular_price: 47,
    currency: 'SEK',
    unit: 'item',
    channel: 'store',
    format: 'ploq',
    store_id: { id: 'SE', region: 'SE-national' },
    source_url: SHELL_SE_PLOQ_URL,
    is_coupon_price: true
  },
  {
    id: 'shell-se-bonustian-fuel-volume-voucher',
    chain_id: 'shell-se',
    operator: 'St1 Sverige AB',
    product_id: 'bonustian-fuel-volume-voucher',
    name: 'Bonustian St1 Mobility fuel-volume voucher',
    category: 'voucher',
    currency: 'SEK',
    unit: 'promotion',
    channel: 'store',
    format: 'ploq',
    store_id: { id: 'SE', region: 'SE-national' },
    source_url: SHELL_SE_BONUSTIAN_URL,
    is_coupon_price: true,
    multi_buy: [
      { minimum_quantity: 15, reward_value: 10, reward_unit: 'SEK', maximum_quantity: 29 },
      { minimum_quantity: 30, reward_value: 20, reward_unit: 'SEK', maximum_quantity: 44 },
      { minimum_quantity: 45, reward_value: 30, reward_unit: 'SEK' }
    ]
  },
  ...[
    ['allra-bast', 'Allra bäst car-wash subscription', 599],
    ['bast', 'Bäst car-wash subscription', 499],
    ['battre', 'Bättre car-wash subscription', 359],
    ['bra', 'Bra car-wash subscription', 299]
  ].map(([productId, name, price]) => ({
    id: `shell-se-wash-subscription-${productId}`,
    chain_id: 'shell-se' as const,
    operator: 'St1 Sverige AB' as const,
    product_id: `wash-subscription-${productId}`,
    name: String(name),
    category: 'car_wash' as const,
    price: Number(price),
    currency: 'SEK' as const,
    unit: 'month' as const,
    channel: 'store' as const,
    format: 'st1-car-wash' as const,
    store_id: { id: 'SE-Stockholm', region: 'SE-Stockholm' as const },
    source_url: SHELL_SE_CAR_WASH_STOCKHOLM_URL,
    is_subscription_price: true
  })),
  {
    id: 'shell-se-stockholm-night-wash-half-price',
    chain_id: 'shell-se',
    operator: 'St1 Sverige AB',
    product_id: 'stockholm-night-wash-half-price',
    name: 'Stockholm night car-wash half-price window',
    category: 'car_wash',
    currency: 'SEK',
    unit: 'promotion',
    channel: 'store',
    format: 'st1-car-wash',
    store_id: { id: 'SE-Stockholm', region: 'SE-Stockholm' },
    source_url: SHELL_SE_CAR_WASH_STOCKHOLM_URL,
    is_clearance: true,
    discount_percent: 50
  }
];

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseSwedishValidFrom(text: string): string {
  const match = text.match(/Listpriser gällande från\s+(\d{1,2})\s+([a-zåäö]+)\s+(\d{4})/i);
  if (!match) throw new Error('Shell SE/St1 valid-from date missing.');
  return new Date(`${match[3]}-${swedishMonth(match[2])}-${match[1].padStart(2, '0')}T00:01:00+02:00`).toISOString();
}

function swedishMonth(monthName: string): string {
  const months: Record<string, string> = { januari: '01', februari: '02', mars: '03', april: '04', maj: '05', juni: '06', juli: '07', augusti: '08', september: '09', oktober: '10', november: '11', december: '12' };
  const month = months[monthName.toLowerCase()];
  if (!month) throw new Error(`Unsupported Shell SE/St1 month: ${monthName}`);
  return month;
}

function priceForLabel(text: string, label: FuelLabel): number {
  const match = text.match(new RegExp(`${escapeRegExp(label)}\\s+([0-9]+(?:[,.][0-9]{1,2})?)\\s*kr`, 'i'));
  if (!match) throw new Error(`Shell SE/St1 price missing for ${label}.`);
  const price = Number.parseFloat(match[1].replace(',', '.'));
  if (!Number.isFinite(price)) throw new Error(`Invalid Shell SE/St1 price for ${label}.`);
  return price;
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
