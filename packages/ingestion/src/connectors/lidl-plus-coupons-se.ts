export const LIDL_PLUS_COUPONS_SE_URL = 'https://api.lidl.com/lidlplus/se/coupons';
export const LIDL_PLUS_COUPONS_SE_RETAILER_ID = 'lidl-se';

export type LidlPlusCouponPromotionRow = {
  retailerId: typeof LIDL_PLUS_COUPONS_SE_RETAILER_ID;
  countryCode: 'SE';
  code: string;
  productName: string;
  price: number | null;
  regularPrice: number | null;
  currency: 'SEK';
  promotionType: 'coupon_required';
  is_coupon_price: true;
  couponRequired: true;
  scanRequired: boolean;
  validFrom: string | null;
  validTo: string | null;
  sourceUrl: string;
  retrievedAt: string;
  raw: Record<string, unknown>;
};

type FetchLike = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export type FetchLidlPlusCouponsSeOptions = {
  sourceUrl?: string;
  retrievedAt?: string | Date;
  fetchImpl?: FetchLike;
};

export const LIDL_PLUS_COUPONS_SE_FIXTURE = {
  coupons: [
    {
      id: 'plus-ost-001',
      title: 'Lidl Plus ost',
      price: 29.9,
      regularPrice: 39.9,
      currency: 'SEK',
      code: 'PLUSOST',
      scanRequired: true,
      validFrom: '2026-05-20',
      validTo: '2026-05-26'
    }
  ]
} as const;

function text(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed)) return parsed;
  }
  if (value && typeof value === 'object' && 'value' in value) return numberValue((value as { value?: unknown }).value);
  return null;
}

function timestamp(value: string | Date | undefined): string {
  const date = value === undefined ? new Date() : value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('retrievedAt must be a valid date.');
  return date.toISOString();
}

function collectCoupons(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) return payload.flatMap(collectCoupons);
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if ((record.id || record.code || record.couponCode) && (record.title || record.name || record.productName)) return [record];
  return ['coupons', 'items', 'results', 'data', 'promotions'].flatMap((key) => collectCoupons(record[key]));
}

export function routeLidlPlusCouponPromotion(coupon: Record<string, unknown>, options: { sourceUrl?: string; retrievedAt?: string | Date } = {}): LidlPlusCouponPromotionRow | null {
  const code = text(coupon.code) ?? text(coupon.couponCode) ?? text(coupon.id);
  const productName = text(coupon.productName) ?? text(coupon.title) ?? text(coupon.name);
  if (!code || !productName) return null;
  return {
    retailerId: LIDL_PLUS_COUPONS_SE_RETAILER_ID,
    countryCode: 'SE',
    code,
    productName,
    price: numberValue(coupon.price) ?? numberValue(coupon.couponPrice),
    regularPrice: numberValue(coupon.regularPrice) ?? numberValue(coupon.oldPrice),
    currency: 'SEK',
    promotionType: 'coupon_required',
    is_coupon_price: true,
    couponRequired: true,
    scanRequired: coupon.scanRequired !== false,
    validFrom: text(coupon.validFrom) ?? text(coupon.startDate) ?? null,
    validTo: text(coupon.validTo) ?? text(coupon.endDate) ?? null,
    sourceUrl: options.sourceUrl ?? LIDL_PLUS_COUPONS_SE_URL,
    retrievedAt: timestamp(options.retrievedAt),
    raw: coupon
  };
}

export function parseLidlPlusCouponsSe(payload: unknown, options: { sourceUrl?: string; retrievedAt?: string | Date } = {}): LidlPlusCouponPromotionRow[] {
  return collectCoupons(payload).flatMap((coupon) => {
    const row = routeLidlPlusCouponPromotion(coupon, options);
    return row ? [row] : [];
  });
}

export async function fetchLidlPlusCouponsSe(options: FetchLidlPlusCouponsSeOptions = {}): Promise<LidlPlusCouponPromotionRow[]> {
  const fetcher = options.fetchImpl ?? (globalThis as { fetch?: FetchLike }).fetch;
  if (!fetcher) throw new Error('fetch is required for Lidl Plus coupon ingestion.');
  const sourceUrl = options.sourceUrl ?? LIDL_PLUS_COUPONS_SE_URL;
  const response = await fetcher(sourceUrl, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Lidl Plus coupon catalog request failed with status ${response.status}.`);
  return parseLidlPlusCouponsSe(await response.json(), { sourceUrl, retrievedAt: options.retrievedAt });
}
