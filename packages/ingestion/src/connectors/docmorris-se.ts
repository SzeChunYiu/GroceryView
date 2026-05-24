export type DocMorrisSeChannel = 'online' | 'store' | 'counter';

export type DocMorrisSeMultiBuy = {
  minimumQuantity: number;
  unitPrice: number;
};

export type DocMorrisSePriceRow = {
  source: 'docmorris-se';
  sourceUrl: string;
  productName: string;
  price: number;
  currency: 'EUR' | 'SEK';
  channel: DocMorrisSeChannel;
  is_coupon_price?: true;
  is_member_price?: true;
  is_subscription_price?: true;
  multi_buy?: DocMorrisSeMultiBuy;
};

export const DOCMORRIS_SE_SOURCE_URLS = [
  'http://docmorris.se/',
  'https://www.docmorris.de/',
  'https://www.docmorris.de/rezepte/rezept-abo',
  'https://www.docmorris.de/lp/gutschein',
  'https://www.docmorris.de/punkte'
] as const;

export const DOCMORRIS_SE_PRICING_QUIRKS = {
  defaultChannel: 'online',
  unsupportedChannels: ['store', 'counter'],
  couponField: 'is_coupon_price',
  loyaltyField: 'is_member_price',
  subscriptionField: 'is_subscription_price',
  multiBuyField: 'multi_buy'
} as const;

type CapturedDocMorrisSeRow = Omit<DocMorrisSePriceRow, 'source' | 'channel'> & {
  channel?: DocMorrisSeChannel;
};

export function normalizeDocMorrisSeRow(row: CapturedDocMorrisSeRow): DocMorrisSePriceRow {
  return {
    ...row,
    source: 'docmorris-se',
    channel: row.channel ?? DOCMORRIS_SE_PRICING_QUIRKS.defaultChannel
  };
}
