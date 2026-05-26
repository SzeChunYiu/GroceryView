import { createHash } from 'node:crypto';
import type { FuelGradeId, FuelPriceSourceKind } from './okq8-fuel.js';

export type SkeljungurIsFuelPriceObservation = {
  domain: 'fuel';
  productId: FuelGradeId | 'fuel-98' | 'fuel-methane' | 'fuel-jet-a1' | 'fuel-avgas' | 'fuel-marine-gasoil';
  gradeLabel: string;
  pricePerLitre: number;
  unit: 'l' | 'kg';
  currency: 'ISK';
  chainId: 'skeljungur-is';
  sourceKind: FuelPriceSourceKind;
  operatorName: 'Skeljungur';
  sourceUrl: string;
  observedAt: string;
  effectiveFrom: string;
  channel: 'list_price';
  is_member_price: false;
  provenance: {
    source: 'skeljungur_is_fuel_price_list';
    parserVersion: typeof SKELJUNGUR_IS_PARSER_VERSION;
    contentDigest: string;
    originalItemName: string;
    originalPriceText: string;
    listPriceDisclaimer: string;
  };
};

export type SkeljungurIsShopPriceObservation = {
  domain: 'shop';
  productId: string;
  sku: string;
  productName: string;
  price: number;
  unit: 'each';
  currency: 'ISK';
  chainId: 'skeljungur-is';
  operatorName: 'Skeljungur';
  sourceUrl: string;
  observedAt: string;
  channel: 'online' | 'store';
  store_id?: 'skeljungur-is-skutuvogur';
  is_member_price: false;
  is_subscription_price: false;
  is_coupon_price: false;
  is_clearance: false;
  multi_buy?: {
    type: 'multi_buy';
    minimumQuantity: number;
    quantityUnit: 'STK';
    totalPrice: number;
  };
  provenance: {
    source: 'skeljungur_is_shop_product_page';
    parserVersion: typeof SKELJUNGUR_IS_PARSER_VERSION;
    contentDigest: string;
    originalPriceText: string;
    originalQuantityText: string;
    originalChannelText: string;
  };
};

type PriceListItem = {
  ItemName?: unknown;
  Price?: unknown;
};

type ProductVariant = {
  display_price?: string;
  price?: {
    amount?: string | number;
    currency?: string;
  };
  sku?: string;
  qty_uom?: string;
  option_values?: Array<{ name?: string; presentation?: string }>;
};

export const SKELJUNGUR_IS_FUEL_PRICES_URL = 'https://en.skeljungur.is/api/pricelistdata';
export const SKELJUNGUR_IS_FUEL_PRICE_PAGE_URL = 'https://en.skeljungur.is/en/fuel-prices';
export const SKELJUNGUR_IS_SAMPLE_PRODUCT_URL = 'https://verslun.skeljungur.is/products/shell-bensinbrusi-5l';
export const SKELJUNGUR_IS_PARSER_VERSION = 'skeljungur-is-pricing-v1';

const LIST_PRICE_DISCLAIMER = 'Prices are list prices and do not account for special terms.';

const fuelGradeMap: Array<{
  needles: string[];
  productId: SkeljungurIsFuelPriceObservation['productId'];
  gradeLabel: string;
  unit: SkeljungurIsFuelPriceObservation['unit'];
}> = [
  { needles: ['bensín 95', 'bensin 95'], productId: 'fuel-95-e10', gradeLabel: 'Skeljungur Bensín 95 okt', unit: 'l' },
  { needles: ['bensín 98', 'bensin 98'], productId: 'fuel-98', gradeLabel: 'Skeljungur Bensín 98 okt', unit: 'l' },
  { needles: ['gasolía-diesel', 'gasolia-diesel', 'diesel'], productId: 'fuel-diesel', gradeLabel: 'Skeljungur Gasolía-Diesel', unit: 'l' },
  { needles: ['jet a-1'], productId: 'fuel-jet-a1', gradeLabel: 'Skeljungur JET A-1', unit: 'l' },
  { needles: ['flugbensín', 'flugbensin'], productId: 'fuel-avgas', gradeLabel: 'Skeljungur Flugbensín', unit: 'l' },
  { needles: ['skipagasolía', 'skipagasolia'], productId: 'fuel-marine-gasoil', gradeLabel: 'Skeljungur Skipagasolía', unit: 'l' },
  { needles: ['metan'], productId: 'fuel-methane', gradeLabel: 'Skeljungur Metan', unit: 'kg' }
];

function contentHashFor(body: string) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

function decodeHtml(value: string) {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Machine-readable amount fields (fuel `Price` "231.30", shop variant `price.amount`
// "26712.0") use the dot as the DECIMAL separator. parseIcelandicPrice strips dots as
// thousands separators (correct only for human display strings like "26.712 kr."), which
// would turn 231.30 -> 23130 and 26712.0 -> 267120. Parse these directly with Number().
function parseMachineAmount(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function fuelSpecFor(itemName: string) {
  const normalized = itemName.toLocaleLowerCase('is-IS');
  return fuelGradeMap.find((spec) => spec.needles.some((needle) => normalized.includes(needle)));
}

function dateFromPriceList(input: { executiontime?: unknown }, capturedAt: string) {
  return typeof input.executiontime === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input.executiontime)
    ? input.executiontime.slice(0, 10)
    : capturedAt.slice(0, 10);
}

export function parseSkeljungurIsFuelPriceList(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): SkeljungurIsFuelPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? SKELJUNGUR_IS_FUEL_PRICES_URL;
  if (!sourceUrl.includes('skeljungur.is')) throw new Error('Skeljungur IS connector only accepts skeljungur.is source URLs');
  if (/access denied|captcha|innskráning/i.test(input.body)) throw new Error('Skeljungur IS fuel source blocked/login page');
  const parsed = JSON.parse(input.body) as { executiontime?: unknown; items?: PriceListItem[] };
  const digest = contentHashFor(input.body);
  const effectiveFrom = dateFromPriceList(parsed, input.capturedAt);

  return (parsed.items ?? []).flatMap((item): SkeljungurIsFuelPriceObservation[] => {
    if (typeof item.ItemName !== 'string') return [];
    const spec = fuelSpecFor(item.ItemName);
    const price = parseMachineAmount(typeof item.Price === 'string' || typeof item.Price === 'number' ? item.Price : undefined);
    if (!spec || price === undefined) return [];
    return [
      {
        domain: 'fuel',
        productId: spec.productId,
        gradeLabel: spec.gradeLabel,
        pricePerLitre: price,
        unit: spec.unit,
        currency: 'ISK',
        chainId: 'skeljungur-is',
        sourceKind: 'operator_public_price_page',
        operatorName: 'Skeljungur',
        sourceUrl,
        observedAt: input.capturedAt,
        effectiveFrom,
        channel: 'list_price',
        is_member_price: false,
        provenance: {
          source: 'skeljungur_is_fuel_price_list',
          parserVersion: SKELJUNGUR_IS_PARSER_VERSION,
          contentDigest: digest,
          originalItemName: item.ItemName,
          originalPriceText: String(item.Price),
          listPriceDisclaimer: LIST_PRICE_DISCLAIMER
        }
      }
    ];
  });
}

export function parseSkeljungurIsShopProductPage(input: {
  body: string;
  capturedAt: string;
  sourceUrl?: string;
}): SkeljungurIsShopPriceObservation[] {
  const sourceUrl = input.sourceUrl ?? SKELJUNGUR_IS_SAMPLE_PRODUCT_URL;
  if (!sourceUrl.includes('verslun.skeljungur.is')) {
    throw new Error('Skeljungur IS shop connector only accepts verslun.skeljungur.is source URLs');
  }
  if (/access denied|captcha|innskráning/i.test(input.body)) throw new Error('Skeljungur IS shop source blocked/login page');
  const digest = contentHashFor(input.body);
  const productName = decodeHtml(input.body.match(/<h1[^>]*>\s*([\s\S]*?)\s*<\/h1>/i)?.[1] ?? 'Skeljungur product');
  const variantsAttr = input.body.match(/\bdata-variants="([^"]+)"/i)?.[1];
  if (!variantsAttr) return [];

  const variants = JSON.parse(decodeHtml(variantsAttr)) as ProductVariant[];
  const channels: Array<{ channel: 'online' | 'store'; store_id?: 'skeljungur-is-skutuvogur'; originalChannelText: string }> = [
    { channel: 'online', originalChannelText: 'Netverslun' },
    { channel: 'store', store_id: 'skeljungur-is-skutuvogur', originalChannelText: 'Verslun Skútuvogi' }
  ];

  return variants
    .filter((variant) => variant.option_values?.length)
    .flatMap((variant): SkeljungurIsShopPriceObservation[] => {
      const price = parseMachineAmount(variant.price?.amount);
      if (price === undefined || variant.price?.currency !== 'ISK' || !variant.sku) return [];
      const quantityText = variant.qty_uom || variant.option_values?.[0]?.presentation || '1 STK';
      const quantity = parseQuantity(quantityText);
      return channels.map((channel) => ({
        domain: 'shop',
        productId: variant.sku!,
        sku: variant.sku!,
        productName,
        price,
        unit: 'each',
        currency: 'ISK',
        chainId: 'skeljungur-is',
        operatorName: 'Skeljungur',
        sourceUrl,
        observedAt: input.capturedAt,
        channel: channel.channel,
        ...(channel.store_id ? { store_id: channel.store_id } : {}),
        is_member_price: false,
        is_subscription_price: false,
        is_coupon_price: false,
        is_clearance: false,
        ...(quantity > 1
          ? {
              multi_buy: {
                type: 'multi_buy' as const,
                minimumQuantity: quantity,
                quantityUnit: 'STK' as const,
                totalPrice: price
              }
            }
          : {}),
        provenance: {
          source: 'skeljungur_is_shop_product_page',
          parserVersion: SKELJUNGUR_IS_PARSER_VERSION,
          contentDigest: digest,
          originalPriceText: variant.display_price ? decodeHtml(variant.display_price) : String(price),
          originalQuantityText: quantityText,
          originalChannelText: channel.originalChannelText
        }
      }));
    });
}

function parseQuantity(quantityText: string) {
  const match = quantityText.match(/(\d+)\s*STK/i);
  return match ? Number(match[1]) : 1;
}

export async function fetchSkeljungurIsFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  priceDate?: string;
  sourceUrl?: string;
} = {}): Promise<SkeljungurIsFuelPriceObservation[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const url = new URL(options.sourceUrl ?? SKELJUNGUR_IS_FUEL_PRICES_URL);
  url.searchParams.set('date', options.priceDate ?? capturedAt.slice(0, 10));
  const response = await (options.fetchImpl ?? fetch)(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'GroceryView/0.1 skeljungur-is-connector (fixture-friendly)'
    }
  });
  if (!response.ok) throw new Error(`Skeljungur IS fuel source blocked with HTTP ${response.status}`);

  return parseSkeljungurIsFuelPriceList({
    body: await response.text(),
    capturedAt,
    sourceUrl: url.toString()
  });
}

export async function fetchSkeljungurIsShopProduct(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<SkeljungurIsShopPriceObservation[]> {
  const sourceUrl = options.sourceUrl ?? SKELJUNGUR_IS_SAMPLE_PRODUCT_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 skeljungur-is-connector (fixture-friendly)'
    }
  });
  if (!response.ok) throw new Error(`Skeljungur IS shop source blocked with HTTP ${response.status}`);

  return parseSkeljungurIsShopProductPage({
    body: await response.text(),
    capturedAt: options.capturedAt ?? new Date().toISOString(),
    sourceUrl
  });
}
