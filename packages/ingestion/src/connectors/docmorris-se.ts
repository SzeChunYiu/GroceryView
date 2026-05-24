export const DOCMORRIS_ONLINE_URL = 'https://www.docmorris.de/';
export const DOCMORRIS_MARKETS_URL = 'https://corporate.docmorris.com/en/about-us/business/markets-and-brands/';

export type DocmorrisSeRow = {
  id: string;
  chain_id: 'docmorris-se';
  operator: 'DocMorris';
  name: string;
  category: 'online_pharmacy' | 'prescription_service' | 'coupon';
  channel: 'online';
  format: 'docmorris-online';
  store_id: { id: 'docmorris-eu'; region: 'EU-cross-border' };
  currency: 'EUR';
  source_url: string;
  is_subscription_price?: boolean;
  is_coupon_price?: boolean;
  coupon_value?: number;
};

export const DOCMORRIS_SE_STATIC_ROWS: DocmorrisSeRow[] = [
  {
    id: 'docmorris-se-rezept-abo',
    chain_id: 'docmorris-se',
    operator: 'DocMorris',
    name: 'Rezept-Abo follow-up prescription service',
    category: 'prescription_service',
    channel: 'online',
    format: 'docmorris-online',
    store_id: { id: 'docmorris-eu', region: 'EU-cross-border' },
    currency: 'EUR',
    source_url: DOCMORRIS_ONLINE_URL,
    is_subscription_price: true
  },
  {
    id: 'docmorris-se-newsletter-voucher-5eur',
    chain_id: 'docmorris-se',
    operator: 'DocMorris',
    name: 'Newsletter voucher',
    category: 'coupon',
    channel: 'online',
    format: 'docmorris-online',
    store_id: { id: 'docmorris-eu', region: 'EU-cross-border' },
    currency: 'EUR',
    source_url: DOCMORRIS_ONLINE_URL,
    is_coupon_price: true,
    coupon_value: 5
  }
];
