export type VitusapotekNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'vitusapotek';
  code: string;
  ean: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  priceText: string;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchVitusapotekNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export const VITUSAPOTEK_NO_BASE_URL = 'https://www.vitusapotek.no';
export const VITUSAPOTEK_NO_DEFAULT_SOURCE_URLS = [
  `${VITUSAPOTEK_NO_BASE_URL}/vare-merker/paracet`,
  `${VITUSAPOTEK_NO_BASE_URL}/produkter/smerte%2C-feber-og-forkjolelse/smertestillende/c/211048`
] as const;

export async function fetchVitusapotekNoProducts(options: FetchVitusapotekNoProductsOptions = {}): Promise<VitusapotekNoProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: VitusapotekNoProduct[] = [];
  const seen = new Set<string>();

  for (const sourceUrl of options.sourceUrls ?? VITUSAPOTEK_NO_DEFAULT_SOURCE_URLS) {
    const html = await fetchHtml(fetchImpl, sourceUrl);
    addRows(rows, seen, parseVitusapotekNoProducts(html, sourceUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined), options.maxRows);
    if (options.maxRows && rows.length >= options.maxRows) return rows;

    for (const productUrl of extractVitusapotekNoProductUrls(html, sourceUrl)) {
      const productHtml = await fetchHtml(fetchImpl, productUrl);
      addRows(rows, seen, parseVitusapotekNoProducts(productHtml, productUrl, retrievedAt, options.maxRows ? options.maxRows - rows.length : undefined), options.maxRows);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  if (rows.length === 0) throw new Error('Vitusapotek NO connector found no parseable product rows.');
  return rows;
}

export function parseVitusapotekNoProducts(html: string, sourceUrl: string, retrievedAt: string, maxRows?: number): VitusapotekNoProduct[] {
  assertVitusapotekSource(sourceUrl);
  assertUsableHtml(html);
  const breadcrumbs = extractBreadcrumbs(html);
  const rows: VitusapotekNoProduct[] = [];
  const seen = new Set<string>();

  for (const node of jsonLdNodes(html)) {
    for (const product of productNodes(node)) {
      const row = normalizeVitusapotekNoProduct(product, sourceUrl, retrievedAt, breadcrumbs);
      if (!row || seen.has(row.code)) continue;
      seen.add(row.code);
      rows.push(row);
      if (maxRows && rows.length >= maxRows) return rows;
    }
  }

  return rows;
}

export function extractVitusapotekNoProductUrls(html: string, sourceUrl: string): string[] {
  assertVitusapotekSource(sourceUrl);
  assertUsableHtml(html);
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const node of jsonLdNodes(html)) {
    for (const item of itemListNodes(node)) {
      const url = absoluteUrl(text((item as Record<string, unknown>).url), sourceUrl);
      if (!url || seen.has(url)) continue;
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

function normalizeVitusapotekNoProduct(
  product: Record<string, unknown>,
  sourceUrl: string,
  retrievedAt: string,
  breadcrumbs: readonly string[]
): VitusapotekNoProduct | null {
  const offer = firstOffer(product.offers);
  const price = numberFromText(offer?.price);
  const currency = text(offer?.priceCurrency) || 'NOK';
  const name = text(product.name);
  const code = text(product.sku) || productCodeFromUrl(text(product.url) || sourceUrl);
  if (!name || !code || price === null || currency !== 'NOK') return null;

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'vitusapotek',
    code,
    ean: eanText(product.gtin13) || eanText(product.gtin) || eanText(product.gtin14),
    name,
    brand: brandName(product.brand),
    category: categoryFrom(product, breadcrumbs),
    price,
    priceText: formatNorwegianMoney(price),
    productUrl: absoluteUrl(text(product.url) || text(offer?.url), sourceUrl),
    imageUrl: absoluteUrl(firstImage(product.image), sourceUrl),
    sourceUrl,
    retrievedAt
  };
}

async function fetchHtml(fetchImpl: typeof fetch, sourceUrl: string): Promise<string> {
  assertVitusapotekSource(sourceUrl);
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 vitusapotek-no-connector'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Vitusapotek NO source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Vitusapotek NO request failed for ${sourceUrl}: ${response.status}`);
  return response.text();
}

function addRows(rows: VitusapotekNoProduct[], seen: Set<string>, candidates: readonly VitusapotekNoProduct[], maxRows?: number): void {
  for (const row of candidates) {
    const key = row.ean || row.code;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
    if (maxRows && rows.length >= maxRows) return;
  }
}

function jsonLdNodes(html: string): unknown[] {
  const nodes: unknown[] = [];
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      nodes.push(JSON.parse(decodeHtml(match[1] ?? '').trim()) as unknown);
    } catch {
      // Ignore malformed JSON-LD blocks and keep scanning the page.
    }
  }
  return nodes;
}

function productNodes(node: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  visit(node, (value) => {
    const type = typeText(value['@type']);
    if ((type === 'product' || type === 'drug') && value.offers) rows.push(value);
  });
  return rows;
}

function itemListNodes(node: unknown): Record<string, unknown>[] {
  const rows: Record<string, unknown>[] = [];
  visit(node, (value) => {
    if (typeText(value['@type']) === 'listitem' && text(value.url)) rows.push(value);
  });
  return rows;
}

function extractBreadcrumbs(html: string): string[] {
  for (const node of jsonLdNodes(html)) {
    const crumbs: string[] = [];
    visit(node, (value) => {
      if (typeText(value['@type']) === 'listitem') {
        const name = text(value.name);
        if (name) crumbs.push(name);
      }
    });
    if (crumbs.length > 0) return crumbs;
  }
  return [];
}

function visit(value: unknown, onObject: (value: Record<string, unknown>) => void): void {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    for (const item of value) visit(item, onObject);
    return;
  }
  const record = value as Record<string, unknown>;
  onObject(record);
  for (const item of Object.values(record)) visit(item, onObject);
}

function firstOffer(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return value.find(isRecord) ?? null;
  return isRecord(value) ? value : null;
}

function brandName(value: unknown): string {
  if (isRecord(value)) return text(value.name);
  return text(value);
}

function categoryFrom(product: Record<string, unknown>, breadcrumbs: readonly string[]): string {
  const direct = text(product.category);
  if (direct) return direct;
  const category = breadcrumbs.filter((item) => !/^(hjem|produkter)$/i.test(item)).slice(0, -1).join('/');
  return category || (typeText(product['@type']) === 'drug' ? 'otc' : 'pharmacy');
}

function firstImage(value: unknown): string {
  if (Array.isArray(value)) return text(value[0]);
  return text(value);
}

function productCodeFromUrl(value: string): string {
  return value.match(/-(\d{5,})\/?$/)?.[1] ?? '';
}

function assertVitusapotekSource(sourceUrl: string): void {
  const url = new URL(sourceUrl);
  if (url.hostname !== 'www.vitusapotek.no' && url.hostname !== 'vitusapotek.no') {
    throw new Error('Vitusapotek NO connector only accepts vitusapotek.no source URLs.');
  }
}

function assertUsableHtml(html: string): void {
  if (/captcha|access denied|cloudflare|logg inn for å fortsette/i.test(html)) throw new Error('Vitusapotek NO source blocked/login page.');
}

function formatNorwegianMoney(value: number): string {
  return `${value.toLocaleString('nb-NO', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} kr`;
}

function typeText(value: unknown): string {
  return Array.isArray(value) ? text(value[0]).toLowerCase() : text(value).toLowerCase();
}

function numberFromText(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const parsed = Number.parseFloat(text(value).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function eanText(value: unknown): string {
  const ean = text(value).replace(/\D/g, '');
  return ean.length >= 8 && ean.length <= 14 ? ean : '';
}

function absoluteUrl(value: string, sourceUrl: string): string {
  if (!value) return '';
  try {
    return new URL(value, sourceUrl).toString();
  } catch {
    return '';
  }
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function text(value: unknown): string {
  return typeof value === 'string' ? decodeHtml(value).trim() : typeof value === 'number' ? String(value) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
