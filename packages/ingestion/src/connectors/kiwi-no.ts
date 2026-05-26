export const KIWI_NO_BASE_URL = 'https://kiwi.no';
export const KIWI_NO_PRICE_CHECK_PATH = '/dagligvarer/prissjekk';
export const KIWI_NO_PARSER_VERSION = 'kiwi-no-prissjekk-v1';

export type KiwiNoAccessResearch = {
  sourceUrl: string;
  status: 'fixture_parser_allowed_public_price_check_only';
  evidence: string[];
  constraints: string[];
};

export type KiwiNoPriceCheckObservation = {
  country: 'NO';
  currency: 'NOK';
  chain: 'kiwi-no';
  code: string;
  name: string;
  regularPrice: number | null;
  regularPriceText: string;
  offerPrice: number;
  offerPriceText: string;
  memberPrice: number | null;
  memberPriceText: string;
  memberOnly: boolean;
  lowestPriceLast30Days: number | null;
  lowestPriceLast30DaysText: string;
  unitPrice: number | null;
  unitPriceText: string;
  unitPriceUnit: string;
  unitPriceEvidence: 'not_published_in_kiwi_prissjekk_row';
  storeScope: 'kiwi_no_assortment_may_vary_by_store';
  sourceUrl: string;
  observedAt: string;
  validTo: string;
  provenance: {
    source: 'kiwi_no_prissjekk';
    parserVersion: string;
    evidenceText: string;
  };
};

export type FetchKiwiNoPriceCheckOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  observedAt?: string;
  maxRows?: number;
};

export const kiwiNoAccessResearch: KiwiNoAccessResearch = {
  sourceUrl: buildKiwiNoPriceCheckUrl(),
  status: 'fixture_parser_allowed_public_price_check_only',
  evidence: [
    'KIWI publishes a public Prissjekk page with product rows containing old shelf price, new shelf price, and lowest price in the last 30 days.',
    'KIWI states that checked products are adjusted after matching lower prices in Rema 1000 and Coop Extra flyers or ads.',
    'KIWI states that some products may not be available in every KIWI store and excludes member offers, benefit programs, bulk buys, and local offers from the price-check matching rule.'
  ],
  constraints: [
    'Parse only public kiwi.no price-check or campaign fixture HTML; do not infer a private API.',
    'Keep store scope as chain-level with assortment-may-vary caveat until store-specific KIWI evidence exists.',
    'Do not emit unit prices or member prices unless KIWI publishes them in the source row.'
  ]
};

export function buildKiwiNoPriceCheckUrl(baseUrl = KIWI_NO_BASE_URL): string {
  return new URL(KIWI_NO_PRICE_CHECK_PATH, baseUrl).toString();
}

export async function fetchKiwiNoPriceCheckObservations(options: FetchKiwiNoPriceCheckOptions = {}): Promise<KiwiNoPriceCheckObservation[]> {
  const sourceUrl = options.sourceUrl ?? buildKiwiNoPriceCheckUrl();
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 kiwi-no-price-check-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`KIWI Norway price-check source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`KIWI Norway price-check source failed with HTTP ${response.status}.`);

  return parseKiwiNoPriceCheckObservations(
    await response.text(),
    sourceUrl,
    options.observedAt ?? new Date().toISOString(),
    options.maxRows
  );
}

export function parseKiwiNoPriceCheckObservations(
  html: string,
  sourceUrl: string,
  observedAt: string,
  maxRows?: number
): KiwiNoPriceCheckObservation[] {
  if (!/kiwi\.no/i.test(sourceUrl)) throw new Error('KIWI Norway connector only accepts kiwi.no source URLs.');
  if (/captcha|access denied|cloudflare|logg inn/i.test(html)) throw new Error('KIWI Norway source returned a blocked/login page.');

  const text = textFromHtml(html);
  const validTo = text.match(/Gjelder til og med\s+(\d{2}\.\d{2}\.\d{4})/i)?.[1] ?? '';
  const rows: KiwiNoPriceCheckObservation[] = [];
  const seen = new Set<string>();

  for (const line of priceCheckLines(text)) {
    const parsed = parsePriceCheckLine(line);
    if (!parsed) continue;
    const code = `kiwi-no-${slugFor(parsed.name)}`;
    if (seen.has(code)) continue;
    seen.add(code);

    rows.push({
      country: 'NO',
      currency: 'NOK',
      chain: 'kiwi-no',
      code,
      name: parsed.name,
      regularPrice: parsed.regularPrice,
      regularPriceText: parsed.regularPriceText,
      offerPrice: parsed.offerPrice,
      offerPriceText: parsed.offerPriceText,
      memberPrice: null,
      memberPriceText: '',
      memberOnly: false,
      lowestPriceLast30Days: parsed.lowestPriceLast30Days,
      lowestPriceLast30DaysText: parsed.lowestPriceLast30DaysText,
      unitPrice: null,
      unitPriceText: '',
      unitPriceUnit: '',
      unitPriceEvidence: 'not_published_in_kiwi_prissjekk_row',
      storeScope: 'kiwi_no_assortment_may_vary_by_store',
      sourceUrl,
      observedAt,
      validTo,
      provenance: {
        source: 'kiwi_no_prissjekk',
        parserVersion: KIWI_NO_PARSER_VERSION,
        evidenceText: line.slice(0, 240)
      }
    });
    if (maxRows && rows.length >= maxRows) break;
  }

  if (rows.length === 0) throw new Error('KIWI Norway price-check source had no parseable price rows.');
  return rows;
}

function priceCheckLines(text: string): string[] {
  const tableStart = text.search(/VARETEKST\s+GAMMEL UTPRIS\s+NY UTPRIS/i);
  const tableText = tableStart >= 0 ? text.slice(tableStart) : text;
  // textFromHtml already emits one HTML element per line, so rows are newline-separated.
  // The previous combined regex used a name lookahead with an over-broad character class
  // (it matched at almost every capital letter and shattered the table into single chars).
  // Split on newlines, then only re-split a glued line where a completed price run (1-3
  // amounts) is immediately followed by the start of the next product name.
  return tableText
    .split('\n')
    .flatMap((line) => line.split(/(?<=\d(?:[,.]\d{1,2})?)\s+(?=[A-ZÆØÅ0-9][A-ZÆØÅ0-9!&'.%/\- ]*?\s+\d+(?:[,.]\d{1,2})?(?:\s+\d+(?:[,.]\d{1,2})?){0,2}(?:\s|$))/g))
    .map((line) => line.replace(/^VARETEKST\s+GAMMEL UTPRIS\s+NY UTPRIS\s+LAVESTE PRIS SISTE 30 DAGENE\s*/i, '').trim())
    .filter(Boolean);
}

function parsePriceCheckLine(line: string): {
  name: string;
  regularPrice: number | null;
  regularPriceText: string;
  offerPrice: number;
  offerPriceText: string;
  lowestPriceLast30Days: number | null;
  lowestPriceLast30DaysText: string;
} | null {
  const matches = [...line.matchAll(/\d+(?:[,.]\d{1,2})?/g)];
  if (matches.length === 0) return null;

  const trailing: RegExpMatchArray[] = [];
  let cursor = line.length;
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const match = matches[index]!;
    const value = match[0];
    const start = match.index ?? 0;
    if (line.slice(start + value.length, cursor).trim()) break;
    trailing.unshift(match);
    cursor = start;
    if (trailing.length === 3) break;
  }
  if (trailing.length !== 1 && trailing.length !== 3) return null;

  const name = line.slice(0, trailing[0]!.index).trim();
  if (!name || name.length < 3 || /Hopp til|Publisert|Endret|Gjelder/i.test(name)) return null;

  const prices = trailing.map((match) => ({ text: match[0], value: parseNorwegianPrice(match[0]) }));
  if (prices.some((price) => price.value === null)) return null;
  if (prices.length === 1) {
    return {
      name,
      regularPrice: null,
      regularPriceText: '',
      offerPrice: prices[0]!.value!,
      offerPriceText: prices[0]!.text,
      lowestPriceLast30Days: null,
      lowestPriceLast30DaysText: ''
    };
  }

  return {
    name,
    regularPrice: prices[0]!.value,
    regularPriceText: prices[0]!.text,
    offerPrice: prices[1]!.value!,
    offerPriceText: prices[1]!.text,
    lowestPriceLast30Days: prices[2]!.value,
    lowestPriceLast30DaysText: prices[2]!.text
  };
}

function parseNorwegianPrice(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function textFromHtml(value: string): string {
  return decodeHtml(value.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, '\n'))
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

function slugFor(value: string): string {
  return value.toLowerCase().replace(/[æå]/g, 'a').replace(/ø/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function decodeHtml(value: string): string {
  return value.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
}
