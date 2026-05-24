export type PressbyranChannel = 'store' | 'online' | 'delivery' | 'b2b_coupon';
export type PressbyranPromotionType = 'member_coupon' | 'student' | 'campaign' | 'standard';

export type PressbyranPriceRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'pressbyran';
  name: string;
  price: number | null;
  priceText: string;
  channel: PressbyranChannel;
  promotionType: PressbyranPromotionType;
  is_member_price: boolean;
  is_coupon_price: boolean;
  is_subscription_price: false;
  is_clearance: false;
  multi_buy: { type: 'case_preorder'; detail: string } | null;
  sourceUrl: string;
  retrievedAt: string;
};

export type PressbyranOfferInput = {
  title: string;
  description?: string;
  priceText?: string;
  sourceUrl: string;
  retrievedAt: string;
};

export function normalizePressbyranOffer(input: PressbyranOfferInput): PressbyranPriceRow {
  const evidence = `${input.title} ${input.description ?? ''} ${input.priceText ?? ''}`.toLowerCase();
  const isMemberCoupon = /kompis|bästis|medlem|app[- ]?kupong|qr-kod|belöning|kupong/.test(evidence);
  const isStudent = /student/.test(evidence);
  const isDelivery = /wolt|foodora|uber eats|hemleverans/.test(evidence);
  const isBusinessCoupon = /företag|kupongbutik|presentkupong/.test(evidence);
  const hasCasePreorder = /hel(a|e) låd|förbeställ|beställningsblankett/.test(evidence);
  const isOnline = /onlinebutik|webshop|köp online/.test(evidence) || input.sourceUrl.includes('webshop.pressbyran.se');

  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'pressbyran',
    name: input.title.trim(),
    price: priceFromText(input.priceText ?? input.description ?? input.title),
    priceText: input.priceText?.trim() ?? '',
    channel: isBusinessCoupon ? 'b2b_coupon' : isDelivery ? 'delivery' : isOnline ? 'online' : 'store',
    promotionType: isMemberCoupon ? 'member_coupon' : isStudent ? 'student' : /kampanj|halva priset|erbjudande/.test(evidence) ? 'campaign' : 'standard',
    is_member_price: isMemberCoupon,
    is_coupon_price: isMemberCoupon || isBusinessCoupon,
    is_subscription_price: false,
    is_clearance: false,
    multi_buy: hasCasePreorder ? { type: 'case_preorder', detail: 'Primary source describes whole-box preorder/order-form flow.' } : null,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt
  };
}

export function parsePressbyranOfferJson(html: string, sourceUrl: string, retrievedAt: string): PressbyranPriceRow[] {
  const rows: PressbyranPriceRow[] = [];
  const scriptPattern = /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(scriptPattern)) {
    try {
      visit(JSON.parse(match[1]!.trim()), (value) => {
        const offer = value as { title?: unknown; name?: unknown; description?: unknown; priceText?: unknown; price?: unknown };
        const title = text(offer.title) || text(offer.name);
        if (!title) return;
        rows.push(normalizePressbyranOffer({
          title,
          description: text(offer.description),
          priceText: text(offer.priceText) || text(offer.price),
          sourceUrl,
          retrievedAt
        }));
      });
    } catch {
      // Ignore non-JSON scripts.
    }
  }
  return rows;
}

function priceFromText(value: string): number | null {
  const match = value.replace(',', '.').match(/(\d+(?:\.\d+)?)\s*(?:kr|:-)/i);
  if (!match) return null;
  const price = Number(match[1]);
  return Number.isFinite(price) ? price : null;
}

function text(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function visit(value: unknown, callback: (value: unknown) => void) {
  callback(value);
  if (Array.isArray(value)) {
    value.forEach((item) => visit(item, callback));
    return;
  }
  if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => visit(item, callback));
  }
}
