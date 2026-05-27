export type KronansApotekSeMultiBuy = {
  kind: 'multi_buy';
  n: number;
  price_sek: number;
};

export type KronansApotekSeProductRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'kronans-apotek';
  channel: 'online';
  product_name: string;
  price_sek: number;
  price_text: string;
  source_url: string;
  observed_at: string;
  is_member_price?: true;
  original_price_sek?: number;
  original_price_text?: string;
  multi_buy?: KronansApotekSeMultiBuy;
};

export const KRONANS_APOTEK_SE_SOURCE_URLS = [
  'https://www.kronansapotek.se/erbjudanden/alltid-hos-oss/',
  'https://www.kronansapotek.se/erbjudanden/kronansapotek-klipp/',
  'https://www.kronansapotek.se/erbjudanden/prisvart/'
] as const;

export type FetchKronansApotekSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  observedAt?: string;
  maxRows?: number;
};

export async function fetchKronansApotekSeProducts(options: FetchKronansApotekSeProductsOptions = {}): Promise<KronansApotekSeProductRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const rows: KronansApotekSeProductRow[] = [];

  for (const sourceUrl of options.sourceUrls ?? KRONANS_APOTEK_SE_SOURCE_URLS) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 kronans-apotek-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (!response.ok) throw new Error(`Kronans Apotek request failed for ${sourceUrl}: ${response.status}`);

    for (const row of parseKronansApotekSeProducts(await response.text(), sourceUrl, observedAt)) {
      rows.push(row);
      if (options.maxRows && rows.length >= options.maxRows) return rows;
    }
  }

  return rows;
}

export function parseKronansApotekSeProducts(html: string, sourceUrl: string, observedAt: string): KronansApotekSeProductRow[] {
  const text = htmlToLines(html);
  const isMemberPage = /alltid-hos-oss/i.test(sourceUrl) || /klubbmedlemmar|klubbpriser/i.test(text.join(' '));
  const rows: KronansApotekSeProductRow[] = [];
  const seen = new Set<string>();

  for (const line of text) {
    const row = parseProductLine(line, sourceUrl, observedAt, isMemberPage);
    if (!row) continue;
    const key = `${row.product_name.toLowerCase()}:${row.price_sek}:${row.source_url}:${row.multi_buy?.n ?? ''}:${row.multi_buy?.price_sek ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(row);
  }

  return rows;
}

function parseProductLine(line: string, sourceUrl: string, observedAt: string, isMemberPage: boolean): KronansApotekSeProductRow | null {
  if (!/(?:pris online|kampanjpris online)/i.test(line)) return null;
  const priceMatch = line.match(/(?:kampanjpris online|pris online)\s*([0-9]+(?:[,.][0-9]+)?)\s*kr/i);
  if (!priceMatch) return null;

  const nameStart = line.search(/Kronans Apotek/i);
  if (nameStart === -1) return null;
  const nameMatch = line
    .slice(nameStart)
    .match(/^(Kronans Apotek\s+.+?)\s+(?:Kosttillskott|Medicinteknisk produkt|Livsmedel|Pris online|Kampanjpris online)/i);
  if (!nameMatch) return null;

  const price = parseMoney(priceMatch[1]);
  if (price === null) return null;

  const row: KronansApotekSeProductRow = {
    country: 'SE',
    currency: 'SEK',
    chain: 'kronans-apotek',
    channel: 'online',
    product_name: cleanName(nameMatch[1]),
    price_sek: price,
    price_text: `${formatMoney(price)} SEK`,
    source_url: sourceUrl,
    observed_at: observedAt
  };

  if (isMemberPage) row.is_member_price = true;

  const multiBuy = parseMultiBuy(line);
  if (multiBuy) row.multi_buy = multiBuy;

  const originalPriceMatch = line.match(/tidigare pris:\s*([0-9]+(?:[,.][0-9]+)?)\s*kr/i);
  if (originalPriceMatch) {
    const originalPrice = parseMoney(originalPriceMatch[1]);
    if (originalPrice !== null) {
      row.original_price_sek = originalPrice;
      row.original_price_text = `${formatMoney(originalPrice)} SEK`;
    }
  }

  return row;
}

function parseMultiBuy(line: string): KronansApotekSeMultiBuy | null {
  const match = line.match(/\b([0-9]+)\s+f[öo]r\s+([0-9]+)(?::-)?/i);
  if (!match) return null;
  const n = Number.parseInt(match[1] ?? '', 10);
  const price = parseMoney(match[2]);
  if (!Number.isInteger(n) || n <= 1 || price === null) return null;
  return { kind: 'multi_buy', n, price_sek: price };
}

function htmlToLines(html: string): string[] {
  return decodeHtml(html)
    .replace(/<\/(li|p|article|div|h[1-6])>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function decodeHtml(value: string): string {
  return value
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&aring;/gi, 'å')
    .replace(/&auml;/gi, 'ä')
    .replace(/&ouml;/gi, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö');
}

function parseMoney(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) / 100 : null;
}

function formatMoney(value: number): string {
  return value.toFixed(2);
}

function cleanName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
