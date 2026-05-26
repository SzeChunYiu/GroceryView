import { createHash } from 'node:crypto';

export const APOTEK_GARDABAER_IS_BASE_URL = 'https://apotekgb.is';
export const APOTEK_GARDABAER_IS_PRODUCTS_URL = `${APOTEK_GARDABAER_IS_BASE_URL}/vorur/`;
export const APOTEK_GARDABAER_IS_PARSER_VERSION = 'apotek-gardabaer-is-wordpress-products-v1';

export type ApotekGardabaerIsProductCategory = 'otc' | 'nursing' | 'supplement' | 'beauty';

export type ApotekGardabaerIsAssortmentRow = {
  country: 'IS';
  currency: 'ISK';
  chain: 'apotek-gardabaer-is';
  retailerType: 'pharmacy';
  code: string;
  name: string;
  category: ApotekGardabaerIsProductCategory;
  categorySlug: string;
  price: null;
  priceText: '';
  available: true;
  productUrl: string;
  brandUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'apotek_gardabaer_wordpress_products_page';
    parserVersion: typeof APOTEK_GARDABAER_IS_PARSER_VERSION;
    contentDigest: string;
    evidenceText: string;
  };
};

export type ApotekGardabaerIsCatalogueStatus = {
  chain: 'apotek-gardabaer-is';
  chainName: 'Apótek Garðabæjar';
  country: 'IS';
  retailerType: 'pharmacy';
  status: 'verified_official_assortment_no_prices';
  qualifiesForOnlinePriceConnector: false;
  sourceUrl: string;
  caveat: string;
};

export type FetchApotekGardabaerIsProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

const categorySpecs: Array<{
  category: ApotekGardabaerIsProductCategory;
  slug: string;
  name: string;
  pattern: RegExp;
  evidence: string;
}> = [
  {
    category: 'otc',
    slug: 'lausasolu-lyf',
    name: 'Lausasölulyf',
    pattern: /lausas[öo]lulyf/i,
    evidence: 'lausasölulyf'
  },
  {
    category: 'nursing',
    slug: 'hjukrunarvorur',
    name: 'Hjúkrunarvörur',
    pattern: /hj[uú]krunarv[öo]rum/i,
    evidence: 'hjúkrunarvörum'
  },
  {
    category: 'supplement',
    slug: 'vitamin-og-faedu-botarefni',
    name: 'Vítamín og fæðubótarefni',
    pattern: /v[ií]tam[ií]num og f[æae]?[ðd]ub[oó]tarefnum/i,
    evidence: 'vítamínum og fæðubótarefnum'
  },
  {
    category: 'beauty',
    slug: 'snyrtivorur',
    name: 'Snyrtivörur',
    pattern: /snyrtiv[öo]rur/i,
    evidence: 'snyrtivörur'
  }
];

export const APOTEK_GARDABAER_IS_CATALOGUE_STATUS: ApotekGardabaerIsCatalogueStatus = {
  chain: 'apotek-gardabaer-is',
  chainName: 'Apótek Garðabæjar',
  country: 'IS',
  retailerType: 'pharmacy',
  status: 'verified_official_assortment_no_prices',
  qualifiesForOnlinePriceConnector: false,
  sourceUrl: APOTEK_GARDABAER_IS_PRODUCTS_URL,
  caveat: 'Apótek Garðabæjar publishes an official WordPress products page with assortment categories and vendor product-information links, but no public product price feed or checkout catalogue.'
};

export async function fetchApotekGardabaerIsProducts(
  options: FetchApotekGardabaerIsProductsOptions = {}
): Promise<ApotekGardabaerIsAssortmentRow[]> {
  const sourceUrl = options.sourceUrl ?? APOTEK_GARDABAER_IS_PRODUCTS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 apotek-gardabaer-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Apótek Garðabæjar source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Apótek Garðabæjar source failed with HTTP ${response.status}.`);

  const rows = parseApotekGardabaerIsProducts(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString());
  if (rows.length === 0) throw new Error('Apótek Garðabæjar source had no source-backed pharmacy assortment rows.');
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseApotekGardabaerIsProducts(
  html: string,
  sourceUrl = APOTEK_GARDABAER_IS_PRODUCTS_URL,
  retrievedAt = new Date().toISOString()
): ApotekGardabaerIsAssortmentRow[] {
  assertApotekGardabaerSource(sourceUrl);
  const sourceText = textFromHtml(html);
  const digest = contentHashFor(html);
  const rows: ApotekGardabaerIsAssortmentRow[] = [];
  const seen = new Set<string>();

  for (const spec of categorySpecs) {
    if (!spec.pattern.test(sourceText)) continue;
    addRow(rows, seen, {
      country: 'IS',
      currency: 'ISK',
      chain: 'apotek-gardabaer-is',
      retailerType: 'pharmacy',
      code: `apotek-gardabaer-is-${spec.slug}`,
      name: spec.name,
      category: spec.category,
      categorySlug: spec.slug,
      price: null,
      priceText: '',
      available: true,
      productUrl: `${pageUrl(sourceUrl)}#${spec.slug}`,
      brandUrl: '',
      sourceUrl,
      retrievedAt,
      provenance: {
        source: 'apotek_gardabaer_wordpress_products_page',
        parserVersion: APOTEK_GARDABAER_IS_PARSER_VERSION,
        contentDigest: digest,
        evidenceText: spec.evidence
      }
    });
  }

  for (const brand of brandLinks(html, sourceUrl)) {
    const category = categoryForBrand(brand.label, brand.url);
    const slug = slugFor(brand.label);
    addRow(rows, seen, {
      country: 'IS',
      currency: 'ISK',
      chain: 'apotek-gardabaer-is',
      retailerType: 'pharmacy',
      code: `apotek-gardabaer-is-brand-${slug}`,
      name: `${brand.label} assortment`,
      category,
      categorySlug: category,
      price: null,
      priceText: '',
      available: true,
      productUrl: brand.url,
      brandUrl: brand.url,
      sourceUrl,
      retrievedAt,
      provenance: {
        source: 'apotek_gardabaer_wordpress_products_page',
        parserVersion: APOTEK_GARDABAER_IS_PARSER_VERSION,
        contentDigest: digest,
        evidenceText: brand.label
      }
    });
  }

  return rows;
}

export function verifyApotekGardabaerIsCatalogueStatus(): ApotekGardabaerIsCatalogueStatus {
  return APOTEK_GARDABAER_IS_CATALOGUE_STATUS;
}

function addRow(
  rows: ApotekGardabaerIsAssortmentRow[],
  seen: Set<string>,
  row: ApotekGardabaerIsAssortmentRow
): void {
  if (seen.has(row.code)) return;
  seen.add(row.code);
  rows.push(row);
}

function brandLinks(html: string, sourceUrl: string): Array<{ label: string; url: string }> {
  const rows: Array<{ label: string; url: string }> = [];
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const label = hostLabel(textFromHtml(match[2] ?? ''));
    const url = absoluteUrl(match[1] ?? '', sourceUrl);
    if (!label || !url || !isProductBrandUrl(url)) continue;
    rows.push({ label, url });
  }
  return rows;
}

function isProductBrandUrl(url: string): boolean {
  return /(?:weleda|welada|eucerin|heilsa|yggdrasill)\./i.test(url);
}

function categoryForBrand(label: string, url: string): ApotekGardabaerIsProductCategory {
  const value = `${label} ${url}`.toLocaleLowerCase('is-IS');
  if (/eucerin|weleda|welada/.test(value)) return 'beauty';
  if (/heilsa|yggdrasill/.test(value)) return 'supplement';
  return 'otc';
}

function assertApotekGardabaerSource(sourceUrl: string): void {
  const host = new URL(sourceUrl).hostname;
  if (host !== 'apotekgb.is' && host !== 'www.apotekgb.is' && host !== 'new.apotekgb.is') {
    throw new Error('Apótek Garðabæjar connector only accepts apotekgb.is source URLs.');
  }
}

function pageUrl(sourceUrl: string): string {
  const url = new URL(sourceUrl);
  url.hash = '';
  return url.toString();
}

function absoluteUrl(value: string, baseUrl: string): string {
  const decoded = decodeHtml(value.trim());
  if (!decoded) return '';
  if (/^[a-z][a-z\d+.-]*:/i.test(decoded)) return decoded;
  if (/^[\w.-]+\.[a-z]{2,}(?:\/.*)?$/i.test(decoded)) return `https://${decoded}`;
  return new URL(decoded, baseUrl).toString();
}

function hostLabel(value: string): string {
  return value.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '').trim();
}

function slugFor(value: string): string {
  return value.toLocaleLowerCase('is-IS')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function textFromHtml(value: string): string {
  return decodeHtml(value)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#8211;|&ndash;/g, '–')
    .replace(/&#039;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .trim();
}

function contentHashFor(body: string): string {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}
