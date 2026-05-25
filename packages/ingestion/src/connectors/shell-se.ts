export const SHELL_SE_HOME_URL = 'https://www.shell.se/';
export const SHELL_SE_PRIVATE_CARD_URL = 'https://www.shell.se/betalningslosningar/shellkort/shell-privatkort.html';
export const SHELL_SE_TRUCK_DIESEL_URL = 'https://www.shell.se/foretagskund/shell-truckdieselkort.html';
export const SHELL_SE_LIST_PRICES_URL = 'https://www.shell.se/foretagskund/listpriser.html';
export const SHELL_SE_PARSER_VERSION = 'shell-se-st1-rebrand-v1';

export type ShellSePricingQuirkRow = {
  chain: 'shell-se';
  country: 'SE';
  currency: 'SEK';
  store_id: 'se:national-rebranded-shell';
  region: 'se-national';
  format: 'st1_rebranded_shell';
  product: string;
  channel: 'store' | 'app' | 'b2b';
  customer_segment: 'consumer' | 'business';
  price: number | null;
  unit: 'l' | 'offer' | 'metadata';
  is_member_price: boolean;
  is_subscription_price: boolean;
  is_coupon_price: boolean;
  is_clearance: boolean;
  multi_buy: null;
  display_price_note?: string;
  out_of_scope_for_consumer_connector?: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    evidenceText: string;
  };
};

export type ParseShellSePricingQuirksInput = {
  homeHtml: string;
  privateCardHtml: string;
  truckDieselHtml: string;
  listPricesHtml: string;
  retrievedAt: string;
};

function textFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function requireEvidence(text: string, pattern: RegExp, label: string) {
  const match = text.match(pattern);
  if (!match) throw new Error(`Shell SE source missing evidence for ${label}.`);
  return match[0];
}

export function parseShellSePricingQuirks(input: ParseShellSePricingQuirksInput): ShellSePricingQuirkRow[] {
  const homeText = textFromHtml(input.homeHtml);
  const privateText = textFromHtml(input.privateCardHtml);
  const truckText = textFromHtml(input.truckDieselHtml);
  const listText = textFromHtml(input.listPricesHtml);
  if (/captcha|access denied|cloudflare|logga in/i.test(`${homeText} ${privateText} ${truckText} ${listText}`)) {
    throw new Error('Shell SE source returned a blocked/login page.');
  }

  const rebrandEvidence = requireEvidence(homeText, /Samtliga Shellstationer i Sverige har nu skyltats om(?: till St1)?|188 stationer/i, 'St1 rebrand');
  const appDiscountEvidence = requireEvidence(privateText, /15\s*(?:öre|rabatt)\/liter|unika erbjudanden och rabatter/i, 'St1 Mobility app discount');
  const b2bEvidence = requireEvidence(listText, /Listpriser|företagskund|St1\.se/i, 'business list prices');
  const truckDisplayEvidence = requireEvidence(truckText, /fiktivt literpris till 1 kr\/liter|Kvittot visar aktuellt pumppris/i, 'truck pump display price');

  const base = {
    chain: 'shell-se' as const,
    country: 'SE' as const,
    currency: 'SEK' as const,
    store_id: 'se:national-rebranded-shell' as const,
    region: 'se-national' as const,
    format: 'st1_rebranded_shell' as const,
    is_subscription_price: false,
    is_clearance: false,
    multi_buy: null,
    retrievedAt: input.retrievedAt
  };

  return [
    {
      ...base,
      product: 'St1 Mobility app fuel discount on former Shell network',
      channel: 'app',
      customer_segment: 'consumer',
      price: 0.15,
      unit: 'l',
      is_member_price: true,
      is_coupon_price: true,
      sourceUrl: SHELL_SE_PRIVATE_CARD_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: appDiscountEvidence }
    },
    {
      ...base,
      product: 'Former Shell Sweden station network rebranded to St1',
      channel: 'store',
      customer_segment: 'consumer',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      sourceUrl: SHELL_SE_HOME_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: rebrandEvidence }
    },
    {
      ...base,
      product: 'Shell/St1 business fuel list-price programme',
      channel: 'b2b',
      customer_segment: 'business',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      out_of_scope_for_consumer_connector: true,
      sourceUrl: SHELL_SE_LIST_PRICES_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: b2bEvidence }
    },
    {
      ...base,
      product: 'Truckstation high-value fill display-price workaround',
      channel: 'b2b',
      customer_segment: 'business',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      out_of_scope_for_consumer_connector: true,
      display_price_note: 'Truck pump display may show 1 kr/liter while receipt/invoice show actual pump/list/net price.',
      sourceUrl: SHELL_SE_TRUCK_DIESEL_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: truckDisplayEvidence }
    }
  ];
}
