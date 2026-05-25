import { parseApoteketSeProducts, type ApoteketSeProductRow } from './apoteket-se.js';

export type LloydsApotekSeProductRow = Omit<ApoteketSeProductRow, 'chain'> & {
  chain: 'lloyds-apotek';
};

export type FetchLloydsApotekSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrls?: readonly string[];
  maxRows?: number;
  observedAt?: string;
};

export const LLOYDS_APOTEK_SE_BASE_URL = 'https://www.lloydsapotek.se';

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
  return parseApoteketSeProducts(html, sourceUrl, observedAt).map((row) => ({
    ...row,
    chain: 'lloyds-apotek',
    source_url: rebaseLloydsUrl(row.source_url || sourceUrl)
  }));
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

function htmlHeaders(): RequestInit {
  return {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 lloyds-apotek-se-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  };
}
