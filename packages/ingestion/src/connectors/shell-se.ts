export const SHELL_SE_HOME_URL = 'https://www.shell.se/';
export const SHELL_SE_PRIVATE_CARD_URL = 'https://www.shell.se/betalningslosningar/shellkort/shell-privatkort.html';
export const ST1_SE_HOME_URL = 'https://st1.se/';
export const ST1_SE_MOBILITY_URL = 'https://st1.se/app-och-erbjudanden/st1-mobility';
export const ST1_SE_BONUSTIAN_URL = 'https://st1.se/privat/bonustian-kampanj';
export const ST1_SE_BUSINESS_CARD_URL = 'https://st1.se/foretag/st1-business-kort-och-app/st1-business-kort';
export const ST1_SE_LIST_PRICES_URL = 'https://st1.se/foretag/foretag-tjanster/listpriser';
export const ST1_SE_TRUCK_LIST_PRICES_URL = 'https://st1.se/foretag/listpris-truck';
export const SHELL_SE_PARSER_VERSION = 'shell-se-st1-rebrand-v2';

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
  multi_buy: string | null;
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
  st1HomeHtml: string;
  privateCardHtml: string;
  mobilityHtml: string;
  bonustianHtml: string;
  businessCardHtml: string;
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
  const st1HomeText = textFromHtml(input.st1HomeHtml);
  const privateText = textFromHtml(input.privateCardHtml);
  const mobilityText = textFromHtml(input.mobilityHtml);
  const bonustianText = textFromHtml(input.bonustianHtml);
  const businessCardText = textFromHtml(input.businessCardHtml);
  const truckText = textFromHtml(input.truckDieselHtml);
  const listText = textFromHtml(input.listPricesHtml);
  if (/captcha|access denied|cloudflare|logga in/i.test(`${homeText} ${st1HomeText} ${privateText} ${mobilityText} ${bonustianText} ${businessCardText} ${truckText} ${listText}`)) {
    throw new Error('Shell SE source returned a blocked/login page.');
  }

  const rebrandEvidence = requireEvidence(homeText, /station network in Sweden has been rebranded|Shellstationer(?:na)?(?:.*)skyltat?s? om(?: alla Shellstationer)?(?: till St1)?/i, 'St1 rebrand');
  const dynamicPriceEvidence = requireEvidence(st1HomeText, /1000 priskontroller dagligen|Prissättningen på våra stationer utgår från världsmarknadspriserna?|lokala konkurrensen/i, 'dynamic local pump pricing');
  const appDiscountEvidence = requireEvidence(privateText, /15\s*(?:öre|rabatt)\/liter|unika erbjudanden och rabatter/i, 'St1 Mobility app discount');
  const appFoodEvidence = requireEvidence(mobilityText, /app-unika erbjudanden|PLOQ\s*\/\s*Välkommen in|Mat & dryck/i, 'app-only food offers');
  const bonustianEvidence = requireEvidence(bonustianText, /15 liter ger 1 Bonustia \(värd 10 kr\), 30 liter ger 2 Bonustior \(värd 20 kr\) och 45 liter ger 3 Bonustior \(värd 30 kr\)|Max 3 Bonustior/i, 'Bonustian volume voucher');
  const b2bEvidence = requireEvidence(listText, /Listpriser för lätt trafik|listpriser för St1 Business-kort/i, 'business list prices');
  const businessCardEvidence = requireEvidence(businessCardText, /St1 Business-kort har ingen årsavgift|450\s+Tankbara ställen|app-unika erbjudanden/i, 'business card terms');
  const truckDisplayEvidence = requireEvidence(truckText, /fiktivt pris på 1 kr\/liter|Kvittot visar korrekt pris|veckolistpris minus eventuell rabatt/i, 'truck pump display price');

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
      product: 'St1 Mobility app-only PLOQ/Välkommen in food offers',
      channel: 'app',
      customer_segment: 'consumer',
      price: null,
      unit: 'offer',
      is_member_price: true,
      is_coupon_price: true,
      sourceUrl: ST1_SE_MOBILITY_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: appFoodEvidence }
    },
    {
      ...base,
      product: 'Bonustian St1 Mobility fuel-volume voucher for PLOQ/Välkommen in',
      channel: 'app',
      customer_segment: 'consumer',
      price: 10,
      unit: 'offer',
      is_member_price: true,
      is_coupon_price: true,
      multi_buy: '15l=10kr_voucher;30l=20kr_vouchers;45l=30kr_vouchers',
      sourceUrl: ST1_SE_BONUSTIAN_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: bonustianEvidence }
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
      product: 'St1 local dynamic pump pricing on former Shell network',
      channel: 'store',
      customer_segment: 'consumer',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      sourceUrl: ST1_SE_HOME_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: dynamicPriceEvidence }
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
      sourceUrl: ST1_SE_BUSINESS_CARD_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: businessCardEvidence }
    },
    {
      ...base,
      product: 'St1 Business light-traffic list-price agreement',
      channel: 'b2b',
      customer_segment: 'business',
      price: null,
      unit: 'metadata',
      is_member_price: false,
      is_coupon_price: false,
      out_of_scope_for_consumer_connector: true,
      sourceUrl: ST1_SE_LIST_PRICES_URL,
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
      display_price_note: 'St1 Truck pump display may show 1 kr/liter while receipt/invoice show the correct list/net price.',
      sourceUrl: ST1_SE_TRUCK_LIST_PRICES_URL,
      provenance: { parserVersion: SHELL_SE_PARSER_VERSION, evidenceText: truckDisplayEvidence }
    }
  ];
}
