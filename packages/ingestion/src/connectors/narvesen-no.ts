export type NarvesenNoStore = {
  chain: 'narvesen-no';
  ownerGroup: 'Reitan Convenience Norway';
  countryCode: 'NO';
  storeId: string;
  name: string;
  streetAddress: string;
  locality: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchNarvesenNoStoresOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
};

export const NARVESEN_NO_BASE_URL = 'https://narvesen.no';
export const NARVESEN_NO_STORE_LOCATOR_URL = `${NARVESEN_NO_BASE_URL}/finn-butikk`;

export async function fetchNarvesenNoStores(options: FetchNarvesenNoStoresOptions = {}): Promise<NarvesenNoStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? NARVESEN_NO_STORE_LOCATOR_URL;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView ingestion (+https://groceryview.example)'
    }
  });
  if (!response.ok) {
    throw new Error(`Narvesen NO store locator request failed for ${sourceUrl}: ${response.status}`);
  }

  return parseNarvesenNoStores(await response.text(), sourceUrl, options.retrievedAt ?? new Date().toISOString());
}

export function parseNarvesenNoStores(html: string, sourceUrl = NARVESEN_NO_STORE_LOCATOR_URL, retrievedAt = new Date().toISOString()): NarvesenNoStore[] {
  const rows: NarvesenNoStore[] = [];
  const seen = new Set<string>();
  const itemPattern = /<li\b(?<attrs>[^>]*\bdata-externalid="[^"]+"[^>]*)>(?<body>[\s\S]*?)<\/li>/gi;
  for (const match of html.matchAll(itemPattern)) {
    const attrs = match.groups?.attrs ?? '';
    const body = match.groups?.body ?? '';
    const storeId = text(attribute(attrs, 'data-externalid'));
    const latitude = numberFromText(attribute(attrs, 'data-lat'));
    const longitude = numberFromText(attribute(attrs, 'data-lng'));
    const name = text(classText(body, 'name') || attribute(attrs, 'data-title'));
    if (!storeId || seen.has(storeId) || latitude === null || longitude === null || !name) continue;
    seen.add(storeId);
    rows.push({
      chain: 'narvesen-no',
      ownerGroup: 'Reitan Convenience Norway',
      countryCode: 'NO',
      storeId,
      name,
      streetAddress: text(classText(body, 'street-address')),
      locality: text(classText(body, 'locality')),
      latitude,
      longitude,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

function attribute(attrs: string, name: string) {
  const match = attrs.match(new RegExp(`${name}="([^"]*)"`, 'i'));
  return match?.[1] ?? '';
}

function classText(html: string, className: string) {
  const match = html.match(new RegExp(`<[^>]+class="[^"]*\\b${className}\\b[^"]*"[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i'));
  return match?.[1] ?? '';
}

function text(value: unknown) {
  return decodeHtml(String(value ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim());
}

function numberFromText(value: unknown) {
  const parsed = Number.parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtml(value: string) {
  return value
    .replace(/&aring;/gi, 'å')
    .replace(/&oslash;/gi, 'ø')
    .replace(/&aelig;/gi, 'æ')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Oslash;/g, 'Ø')
    .replace(/&AElig;/g, 'Æ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}
