import { parseApoteketSeProducts, type ApoteketSeProductRow } from './apoteket-se.js';

export type LloydsApotekSeProductRow = Omit<ApoteketSeProductRow, 'chain'> & {
  chain: 'lloyds-apotek';
  channel: 'online';
  format: 'doz_webshop';
  is_clearance: boolean;
  is_subscription_price: false;
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
  'https://www.lloydsapotek.se/sok?q=vitamin',
  'https://www.lloydsapotek.se/sok?q=allergi',
  'https://www.lloydsapotek.se/sok?q=solskydd',
  'https://www.lloydsapotek.se/sok?q=tandkram',
  'https://www.lloydsapotek.se/sok?q=alvedon'
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
  return parseApoteketSeProducts(html, sourceUrl, observedAt).map((row) => {
    const source_url = rebaseLloydsUrl(row.source_url || sourceUrl);
    const lloydsRow: LloydsApotekSeProductRow = {
      ...row,
      chain: 'lloyds-apotek',
      channel: 'online',
      format: 'doz_webshop',
      source_url,
      is_clearance: isClearanceSource(sourceUrl) || isClearanceSource(source_url),
      is_subscription_price: false
    };
    const sourceMultiBuy = multiBuyFromSource(sourceUrl);
    if (sourceMultiBuy && !lloydsRow.multi_buy) lloydsRow.multi_buy = sourceMultiBuy;
    return lloydsRow;
  });
}

function rebaseLloydsUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.hostname === 'www.apoteket.se') {
      return `${DOZ_APOTEK_SE_BASE_URL}${url.pathname}${url.search}${url.hash}`;
    }
    if (url.hostname === 'www.lloydsapotek.se') {
      return `${DOZ_APOTEK_SE_BASE_URL}${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    // Keep parser output if it is not a URL.
  }
  return value;
}

function isClearanceSource(value: string): boolean {
  return /\/outlet\/kort-hallbarhet\b/i.test(value);
}

function multiBuyFromSource(value: string): string | null {
  const path = safePath(value);
  if (/\/2-for-50-kr-v6-ask\b/i.test(path)) return '2 för 50 kr V6 Tuggummi Ask';
  return null;
}

function safePath(value: string): string {
  try {
    return new URL(value).pathname;
  } catch {
    return value;
  }
}

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 lloyds-apotek-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}
