export const MLYN_NO_CONNECTOR_ID = 'mlyn-no';
export const MLYN_NO_CATEGORY = 'ethnic_polish_eastern_european';

export type MlynNoStore = {
  storeId: string;
  name: string;
  address: string;
  city: string;
  countryCode: 'NO';
  category: typeof MLYN_NO_CATEGORY;
  sourceUrl: string;
  retrievedAt: string;
};

export function parseMlynNoLocations(html: string, sourceUrl: string, retrievedAt: string): MlynNoStore[] {
  const stores = new Map<string, MlynNoStore>();
  for (const json of extractJsonLdBlocks(html)) {
    const nodes = Array.isArray(json) ? json : [json];
    for (const node of nodes) {
      const type = String((node as { '@type'?: unknown })['@type'] ?? '').toLowerCase();
      if (!type.includes('store') && !type.includes('localbusiness')) continue;
      const name = text((node as { name?: unknown }).name);
      const address = formatAddress((node as { address?: unknown }).address);
      const city = cityFromAddress((node as { address?: unknown }).address) || cityFromFreeText(address);
      if (!name || !address || !city) continue;
      const storeId = slugify(`${name}-${city}-${address}`);
      stores.set(storeId, { storeId, name, address, city, countryCode: 'NO', category: MLYN_NO_CATEGORY, sourceUrl, retrievedAt });
    }
  }

  for (const match of html.matchAll(/data-store-name=["']([^"']+)["'][^>]*data-address=["']([^"']+)["'][^>]*data-city=["']([^"']+)["']/g)) {
    const name = decodeHtml(match[1]);
    const address = decodeHtml(match[2]);
    const city = decodeHtml(match[3]);
    const storeId = slugify(`${name}-${city}-${address}`);
    stores.set(storeId, { storeId, name, address, city, countryCode: 'NO', category: MLYN_NO_CATEGORY, sourceUrl, retrievedAt });
  }

  return [...stores.values()].sort((left, right) => left.storeId.localeCompare(right.storeId));
}

export async function fetchMlynNoStores(
  urls: readonly string[],
  options: { fetchImpl?: typeof fetch; retrievedAt?: string } = {}
): Promise<MlynNoStore[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const stores = new Map<string, MlynNoStore>();
  for (const url of urls) {
    const response = await fetchImpl(url, { headers: { accept: 'text/html,application/xhtml+xml' } });
    if (!response.ok) throw new Error(`Mlyn NO location request failed: ${response.status}`);
    for (const store of parseMlynNoLocations(await response.text(), url, retrievedAt)) stores.set(store.storeId, store);
  }
  if (stores.size < 2) throw new Error('Mlyn NO connector expected multiple verified locations.');
  return [...stores.values()].sort((left, right) => left.storeId.localeCompare(right.storeId));
}

function extractJsonLdBlocks(html: string): unknown[] {
  const blocks: unknown[] = [];
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      blocks.push(JSON.parse(decodeHtml(match[1])));
    } catch {
      continue;
    }
  }
  return blocks;
}

function formatAddress(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (!value || typeof value !== 'object') return '';
  const address = value as { streetAddress?: unknown; postalCode?: unknown; addressLocality?: unknown };
  return [text(address.streetAddress), text(address.postalCode), text(address.addressLocality)].filter(Boolean).join(', ');
}

function cityFromAddress(value: unknown): string {
  return value && typeof value === 'object' ? text((value as { addressLocality?: unknown }).addressLocality) : '';
}

function cityFromFreeText(value: string): string {
  return value.split(',').at(-1)?.trim() ?? '';
}

function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
}

function decodeHtml(value: string): string {
  return value.replace(/&quot;/g, '"').replace(/&#34;/g, '"').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
}
