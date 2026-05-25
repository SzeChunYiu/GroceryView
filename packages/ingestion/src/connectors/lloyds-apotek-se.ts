import { parseApoteketSeProducts, type ApoteketSeProductRow } from './apoteket-se.js';

export type LloydsApotekSeProductRow = Omit<ApoteketSeProductRow, 'chain'> & {
  chain: 'lloyds-apotek';
  campaign_label?: string;
  context_labels?: readonly string[];
  delivery_partners?: readonly string[];
  is_clearance?: boolean;
};

export type FetchLloydsApotekSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const LLOYDS_APOTEK_SE_BASE_URL = 'https://www.lloydsapotek.se';
export const DOZ_APOTEK_SE_BASE_URL = 'https://dozapotek.se';

export const DEFAULT_LLOYDS_APOTEK_SE_SOURCE_URLS = [
  'https://dozapotek.se/varumarken/doz-apotek',
  'https://dozapotek.se/catalogsearch/result/?q=vitamin',
  'https://dozapotek.se/catalogsearch/result/?q=allergi',
  'https://dozapotek.se/catalogsearch/result/?q=solskydd',
  'https://dozapotek.se/catalogsearch/result/?q=tandkram'
] as const;

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
  const rows: LloydsApotekSeProductRow[] = [];
  const seen = new Set<string>();
  const push = (row: LloydsApotekSeProductRow) => {
    const key = `${row.product_name.toLowerCase()}:${row.price_sek}:${row.unit}:${row.source_url}:${row.campaign_label ?? ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(row);
  };

  for (const row of parseApoteketSeProducts(html, sourceUrl, observedAt)) {
    push({
      ...row,
      chain: 'lloyds-apotek',
      source_url: rebaseLloydsUrl(row.source_url || sourceUrl)
    });
  }

  for (const row of parseDozMagentoProductCards(html, sourceUrl, observedAt)) {
    push(row);
  }

  return rows;
}

function rebaseLloydsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname === 'www.apoteket.se') {
      return `${LLOYDS_APOTEK_SE_BASE_URL}${url.pathname}${url.search}${url.hash}`;
    }
    if (url.hostname === 'www.lloydsapotek.se') {
      return `${DOZ_APOTEK_SE_BASE_URL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return new URL(value, DOZ_APOTEK_SE_BASE_URL).toString();
  }
  return value;
}

function parseDozMagentoProductCards(html: string, sourceUrl: string, observedAt: string): LloydsApotekSeProductRow[] {
  const pageCampaignLabel = campaignLabelFromPage(html);
  return productCardBlocks(html)
    .map((card) => normalizeDozMagentoProductCard(card, sourceUrl, observedAt, pageCampaignLabel))
    .filter((row): row is LloydsApotekSeProductRow => row !== null);
}

function normalizeDozMagentoProductCard(card: string, sourceUrl: string, observedAt: string, pageCampaignLabel = ''): LloydsApotekSeProductRow | null {
  const productName = attribute(card, 'data-ls-product-name') || productLinkText(card);
  const priceSek = numberFromText(attribute(card, 'data-ls-price'));
  const currency = (attribute(card, 'data-ls-price-currency') || 'SEK').toUpperCase();
  if (!productName || priceSek === null || currency !== 'SEK') return null;

  const productUrl = absoluteDozUrl(attribute(card, 'data-ls-product-url') || productLinkHref(card) || sourceUrl);
  const contextLabels = unique([
    pageCampaignLabel,
    ...campaignLabelsFromCard(card),
    ...imageAltLabels(card).filter((label) => /wolt/i.test(label))
  ]);
  const campaignLabel = contextLabels.find((label) => /(\d+\s*(?:st\s*)?för\s*\d+|\d+\s*%\s*vid köp av\s*\d+|kort|outlet|pangpris)/i.test(label));
  const deliveryPartners = unique(contextLabels.filter((label) => /^wolt$/i.test(label)).map(() => 'Wolt'));
  const row: LloydsApotekSeProductRow = {
    country: 'SE',
    currency: 'SEK',
    chain: 'lloyds-apotek',
    product_name: productName,
    price_sek: roundMoney(priceSek),
    unit: unitFromName(productName),
    observed_at: observedAt,
    source_url: productUrl
  };

  if (campaignLabel) {
    row.campaign_label = campaignLabel;
    row.is_coupon_price = true;
    if (/(\d+\s*(?:st\s*)?för\s*\d+|\d+\s*%\s*vid köp av\s*\d+)/i.test(campaignLabel)) {
      row.multi_buy = campaignLabel;
    }
  }
  if (contextLabels.length > 0) row.context_labels = contextLabels;
  if (deliveryPartners.length > 0) row.delivery_partners = deliveryPartners;
  if (contextLabels.some((label) => /outlet|kort\s*(?:datum|hållbarhet)|pangpris/i.test(label))) {
    row.is_clearance = true;
  }

  return row;
}

function productCardBlocks(html: string): string[] {
  return [...html.matchAll(/<form\b(?=[^>]*\bproduct-item\b)(?=[^>]*\bproduct_addtocart_form\b)[^>]*>[\s\S]*?<\/form>/gi)]
    .map((match) => match[0] ?? '');
}

function campaignLabelFromPage(html: string): string {
  const title = attribute(html, 'content', /<meta\b[^>]*\bname=["']title["'][^>]*>/i) || stripTags(matchText(html, /<title\b[^>]*>([\s\S]*?)<\/title>/i));
  const label = normalizeCampaignLabel(title.split(/\s+-\s+/)[0] ?? '');
  return /(\d+\s*(?:st\s*)?för\s*\d+|\d+\s*%\s*vid köp av\s*\d+|kort|outlet|pangpris)/i.test(label) ? label : '';
}

function campaignLabelsFromCard(card: string): string[] {
  const labels: string[] = [];
  const plainText = stripTags(card);
  for (const pattern of [
    /\b\d+\s*st\s*för\s*\d+\s*(?:kr|:-)?/gi,
    /\b\d+\s*för\s*\d+\s*(?:kr|:-)?/gi,
    /\b\d+\s*%\s*vid köp av\s*\d+\b/gi,
    /\bkort\s*(?:datum|hållbarhet)\s*\d*%?/gi,
    /\bpangpris!\s*\(kort datum\)/gi,
    /\boutlet\b/gi
  ]) {
    for (const match of plainText.matchAll(pattern)) {
      const label = normalizeCampaignLabel(match[0] ?? '');
      if (label) labels.push(label);
    }
  }
  return unique(labels);
}

function imageAltLabels(card: string): string[] {
  return [...card.matchAll(/<img\b[^>]*>/gi)]
    .map((match) => attribute(match[0] ?? '', 'alt'))
    .filter(Boolean);
}

function productLinkText(card: string): string {
  return stripTags(matchText(card, /<a\b[^>]*\bclass=["'][^"']*\bproduct-item-link\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/i));
}

function productLinkHref(card: string): string {
  const match = card.match(/<a\b[^>]*\bclass=["'][^"']*\bproduct-item-link\b[^"']*["'][^>]*>/i);
  return match ? attribute(match[0], 'href') : '';
}

function attribute(markup: string, name: string, elementPattern?: RegExp): string {
  const source = elementPattern ? (markup.match(elementPattern)?.[0] ?? '') : markup;
  const match = source.match(new RegExp(`\\b${escapeRegExp(name)}=(["'])(.*?)\\1`, 'is'));
  return match ? normalizeText(decodeHtmlEntities(match[2] ?? '')) : '';
}

function matchText(value: string, pattern: RegExp): string {
  return value.match(pattern)?.[1] ?? '';
}

function stripTags(value: string): string {
  return normalizeText(decodeHtmlEntities(value.replace(/<[^>]*>/g, ' ')));
}

function normalizeCampaignLabel(value: string): string {
  const normalized = normalizeText(value)
    .replace(/\s*:-/g, ' kr')
    .replace(/\bkr\./gi, 'kr');
  const leadingMultiBuy = normalized.match(/^(\d+\s*(?:st\s*)?för\s*\d+\s*kr)\s+(.+)$/i);
  if (leadingMultiBuy) return normalizeText(`${leadingMultiBuy[2]} ${leadingMultiBuy[1]}`);
  return normalized;
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function absoluteDozUrl(value: string): string {
  return /^https?:\/\//i.test(value) ? value : new URL(value, DOZ_APOTEK_SE_BASE_URL).toString();
}

function numberFromText(value: string): number | null {
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function unitFromName(name: string): string {
  const match = name.match(/(\d+(?:[,.]\d+)?)\s*(ml|cl|l|g|kg|st|styck|tabletter|tablett|kapslar|kapsel|tester|pack)\b/i);
  if (!match) return 'st';
  const amount = match[1]?.replace(',', '.') ?? '1';
  const rawUnit = (match[2] ?? 'st').toLowerCase();
  return `${amount} ${rawUnit === 'styck' ? 'st' : rawUnit}`;
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function unique(values: string[]): string[] {
  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;|&#160;/g, ' ');
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
