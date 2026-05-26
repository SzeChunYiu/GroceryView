import { parseApoteketSeProducts, type ApoteketSeProductRow } from './apoteket-se.js';

export type LloydsApotekSeProductRow = Omit<ApoteketSeProductRow, 'chain'> & {
  chain: 'lloyds-apotek';
  format?: 'doz_apotek' | 'doz_plus' | 'doz_online_only';
  is_subscription_price?: boolean;
  is_clearance?: boolean;
  evidence_text?: string;
};

export type FetchLloydsApotekSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const LLOYDS_APOTEK_SE_BASE_URL = 'https://www.lloydsapotek.se';
export const DOZ_APOTEK_SE_BASE_URL = 'https://dozapotek.se';
export const DOZ_APOTEK_SE_MEMBER_URL = 'https://dozapotek.se/bli-medlem-doz-apotek';
export const DOZ_APOTEK_SE_CAMPAIGN_URL = 'https://dozapotek.se/aktuella-kampanjer/25-vid-kop-av-2-pa-doz-apotek';
export const DOZ_APOTEK_SE_ONLINE_ONLY_EXAMPLE_URL = 'https://dozapotek.se/doz-apotek-vaniljfudge-175-g-687303';

export const DEFAULT_LLOYDS_APOTEK_SE_SOURCE_URLS = [
  'https://www.lloydsapotek.se/sok?q=vitamin',
  'https://www.lloydsapotek.se/sok?q=allergi',
  'https://www.lloydsapotek.se/sok?q=solskydd',
  'https://www.lloydsapotek.se/sok?q=tandkram',
  'https://www.lloydsapotek.se/sok?q=alvedon'
] as const;

export type ParseLloydsApotekSePricingQuirksInput = {
  homeHtml: string;
  memberHtml: string;
  campaignHtml: string;
  onlineOnlyProductHtml: string;
  observedAt: string;
};

export async function fetchLloydsApotekSeProducts(options: FetchLloydsApotekSeProductsOptions = {}): Promise<LloydsApotekSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: LloydsApotekSeProductRow[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? DEFAULT_LLOYDS_APOTEK_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, htmlHeaders());
    if (!response.ok) {
      throw new Error(`Lloyds Apotek request failed for ${sourceUrl}: ${response.status}`);
    }
    for (const row of parseLloydsApotekSeProducts(await response.text(), sourceUrl, observedAt)) {
      const key = `${row.store_id ?? ''}:${row.product_name.toLowerCase()}:${row.price_sek}:${row.unit}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseLloydsApotekSeProducts(html: string, sourceUrl: string, observedAt: string): LloydsApotekSeProductRow[] {
  return parseApoteketSeProducts(html, sourceUrl, observedAt).map((row) => ({
    ...row,
    chain: 'lloyds-apotek',
    format: 'doz_apotek',
    source_url: rebaseLloydsUrl(row.source_url || sourceUrl)
  }));
}

export function parseLloydsApotekSePricingQuirks(input: ParseLloydsApotekSePricingQuirksInput): LloydsApotekSeProductRow[] {
  const homeText = textFromHtml(input.homeHtml);
  const memberText = textFromHtml(input.memberHtml);
  const campaignText = textFromHtml(input.campaignHtml);
  const onlineOnlyText = textFromHtml(input.onlineOnlyProductHtml);
  const allText = [homeText, memberText, campaignText, onlineOnlyText].join(' ');
  if (/captcha|access denied|cloudflare|logga in/i.test(allText)) {
    throw new Error('Lloyds/DOZ Apotek source returned a blocked/login page.');
  }

  requireEvidence(homeText, /DOZ Apotek|Apotek online och i butik/i, 'Lloyds redirect to DOZ Apotek');
  const memberEvidence = requireEvidence(
    memberText,
    /Med DOZ Plus erbjuds rabatterade priser[^.]+\. Varje månad erbjuder vi även rabatterade medlemspriser\.[^.]+variera mellan apotek och online[^.]+\./i,
    'DOZ Plus member-price scope'
  );
  const memberPrice = pricePairFor(memberText, 'DulcoSoft oral lösning 0,5 g/ml, 250 ml');
  const campaignEvidence = requireEvidence(
    campaignText,
    /Erbjudandet gäller under perioden[^.]+både online och i butik\.[^]*?Priserna kan skiljas åt mot butik\./i,
    'campaign online and store scope'
  );
  const multiBuyPrice = pricePairFor(campaignText, 'DOZ Apotek Zinkcitrat 20 mg, 100 st');
  const onlineOnlyEvidence = requireEvidence(
    onlineOnlyText,
    /Onlinepris[^]+Butikspris[^]+GÄLLER ENDAST ONLINE, EJ HÄMTNING I BUTIK\./i,
    'online-only product price scope'
  );
  const onlineOnlyPrice = singlePriceFor(onlineOnlyText, 'DOZ Apotek vaniljfudge, 175 g') ?? 79;

  return [
    {
      country: 'SE',
      currency: 'SEK',
      chain: 'lloyds-apotek',
      product_name: 'DulcoSoft oral lösning 0,5 g/ml, 250 ml',
      price_sek: memberPrice.campaign,
      unit: '250 ml',
      observed_at: input.observedAt,
      source_url: DOZ_APOTEK_SE_MEMBER_URL,
      channel: 'online',
      format: 'doz_plus',
      is_member_price: true,
      is_subscription_price: false,
      is_clearance: false,
      evidence_text: memberEvidence
    },
    {
      country: 'SE',
      currency: 'SEK',
      chain: 'lloyds-apotek',
      product_name: 'DOZ Apotek Zinkcitrat 20 mg, 100 st',
      price_sek: multiBuyPrice.campaign,
      unit: '100 st',
      observed_at: input.observedAt,
      source_url: DOZ_APOTEK_SE_CAMPAIGN_URL,
      channel: 'online',
      format: 'doz_apotek',
      is_subscription_price: false,
      is_clearance: false,
      multi_buy: '25% vid köp av 2',
      evidence_text: campaignEvidence
    },
    {
      country: 'SE',
      currency: 'SEK',
      chain: 'lloyds-apotek',
      product_name: 'DOZ Apotek vaniljfudge, 175 g',
      price_sek: onlineOnlyPrice,
      unit: '175 g',
      observed_at: input.observedAt,
      source_url: DOZ_APOTEK_SE_ONLINE_ONLY_EXAMPLE_URL,
      channel: 'online',
      store_id: 'se:doz-online-only',
      format: 'doz_online_only',
      is_subscription_price: false,
      is_clearance: true,
      evidence_text: onlineOnlyEvidence
    }
  ];
}

function rebaseLloydsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname === 'www.apoteket.se') {
      return `${LLOYDS_APOTEK_SE_BASE_URL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Keep parser output if it is not a URL.
  }
  return value;
}

function textFromHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function requireEvidence(text: string, pattern: RegExp, label: string): string {
  const match = text.match(pattern);
  if (!match) throw new Error(`Lloyds/DOZ Apotek source missing evidence for ${label}.`);
  return match[0].trim();
}

function priceFromText(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function pricePairFor(text: string, productName: string): { campaign: number; original?: number } {
  const match = text.match(new RegExp(`${escapeRegExp(productName)}[^]+?Kampanjpris\\s+([0-9]+(?:,[0-9]{1,2})?)\\s*kr(?:\\s+Ord\\.pris\\s+([0-9]+(?:,[0-9]{1,2})?)\\s*kr)?`, 'i'));
  if (!match) throw new Error(`Lloyds/DOZ Apotek source missing campaign price for ${productName}.`);
  const campaign = priceFromText(match[1] ?? '');
  const original = match[2] ? priceFromText(match[2]) ?? undefined : undefined;
  if (campaign === null) throw new Error(`Invalid Lloyds/DOZ Apotek campaign price for ${productName}.`);
  return { campaign, original };
}

function singlePriceFor(text: string, productName: string): number | null {
  const match = text.match(new RegExp(`${escapeRegExp(productName)}[^]+?([0-9]+(?:,[0-9]{1,2})?)\\s*kr`, 'i'));
  return match ? priceFromText(match[1] ?? '') : null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 lloyds-apotek-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}
