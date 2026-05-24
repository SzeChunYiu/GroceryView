export type ApoteksgruppenSeChannel = 'online' | 'store';

export type ApoteksgruppenSePromotionRow = {
  chainId: 'apoteksgruppen_se';
  successorChainId: 'kronans_apotek';
  productName: string;
  price: number | null;
  channel: ApoteksgruppenSeChannel;
  format: null;
  store_id: string | null;
  region: string | null;
  is_member_price: boolean;
  is_subscription_price: false;
  is_coupon_price: boolean;
  is_clearance: false;
  multi_buy: { minimumQuantity: number; rewardText: string } | null;
  sourceUrl: string;
  evidence: string;
};

export type ApoteksgruppenDualChannelInput = {
  productName: string;
  onlinePrice?: number | null;
  storePrice?: number | null;
  store_id?: string | null;
  region?: string | null;
  sourceUrl: string;
};

function parseMultiBuy(text: string): ApoteksgruppenSePromotionRow['multi_buy'] {
  const threeForTwo = text.match(/(\d+)\s*f[öo]r\s*(\d+)/i);
  if (threeForTwo) return { minimumQuantity: Number(threeForTwo[1]), rewardText: threeForTwo[0] };
  const buyN = text.match(/k[öo]p\s*(\d+)\s*f[åa]/i);
  if (buyN) return { minimumQuantity: Number(buyN[1]), rewardText: text.trim() };
  return null;
}

export function buildApoteksgruppenDualChannelRows(input: ApoteksgruppenDualChannelInput): ApoteksgruppenSePromotionRow[] {
  const base = {
    chainId: 'apoteksgruppen_se' as const,
    successorChainId: 'kronans_apotek' as const,
    productName: input.productName,
    format: null,
    store_id: input.store_id ?? null,
    region: input.region ?? null,
    is_member_price: false,
    is_subscription_price: false as const,
    is_coupon_price: false,
    is_clearance: false as const,
    multi_buy: null,
    sourceUrl: input.sourceUrl,
    evidence: 'Kronans/Apoteksgruppen terms state prices can differ online and in store.'
  };
  return [
    input.onlinePrice == null ? null : { ...base, channel: 'online' as const, price: input.onlinePrice },
    input.storePrice == null ? null : { ...base, channel: 'store' as const, price: input.storePrice }
  ].filter((row): row is ApoteksgruppenSePromotionRow => row !== null);
}

export function parseApoteksgruppenOfferText(text: string, sourceUrl: string): ApoteksgruppenSePromotionRow[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const percentMatch = line.match(/(.+?)\s+(upp till\s+)?(\d{1,2})\s*%/i);
      const multiBuy = parseMultiBuy(line);
      if (!percentMatch && !multiBuy) return null;
      const productName = (percentMatch?.[1] ?? line).replace(/för våra klubbmedlemmar/i, '').trim();
      return {
        chainId: 'apoteksgruppen_se',
        successorChainId: 'kronans_apotek',
        productName,
        price: null,
        channel: 'online',
        format: null,
        store_id: null,
        region: null,
        is_member_price: /klubb|medlem/i.test(line),
        is_subscription_price: false,
        is_coupon_price: false,
        is_clearance: false,
        multi_buy: multiBuy,
        sourceUrl,
        evidence: line
      } satisfies ApoteksgruppenSePromotionRow;
    })
    .filter((row): row is ApoteksgruppenSePromotionRow => row !== null);
}
