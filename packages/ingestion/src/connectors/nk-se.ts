export type NkSeDepartment = 'beauty' | 'food_drink' | 'home' | 'other';

export type NkSeProduct = {
  chain: 'nk_se';
  name: string;
  department: NkSeDepartment;
  price: number;
  originalPrice: number | null;
  currency: 'SEK';
  isSale: boolean;
  promotionLabel: string | null;
  sourceUrl: string;
  retrievedAt: string;
};

export type FetchNkSeProductsOptions = {
  fetchImpl?: typeof fetch;
  sourcePaths?: readonly string[];
  retrievedAt?: string;
  maxRows?: number;
};

export const NK_SE_BASE_URL = 'https://www.nk.se';
export const DEFAULT_NK_SE_SOURCE_PATHS = ['/skonhet', '/mat-dryck'] as const;

function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${NK_SE_BASE_URL}${path}`;
}

function decodeText(text: string) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&aring;/g, 'å')
    .replace(/&auml;/g, 'ä')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Aring;/g, 'Å')
    .replace(/&Auml;/g, 'Ä')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/\s+/g, ' ')
    .trim();
}

function htmlLines(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '\n')
    .replace(/<style[\s\S]*?<\/style>/gi, '\n')
    .replace(/<[^>]+>/g, '\n')
    .split('\n')
    .map(decodeText)
    .filter(Boolean);
}

function numberFromSek(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function departmentFor(sourceUrl: string): NkSeDepartment {
  if (/skonhet/i.test(sourceUrl)) return 'beauty';
  if (/mat-dryck/i.test(sourceUrl)) return 'food_drink';
  if (/\/hem/i.test(sourceUrl)) return 'home';
  return 'other';
}

export function parseNkSeProducts(html: string, sourceUrl: string, retrievedAt: string): NkSeProduct[] {
  const department = departmentFor(sourceUrl);
  const rows: NkSeProduct[] = [];
  let promotionLabel: string | null = null;
  const seen = new Set<string>();

  for (const line of htmlLines(html)) {
    if (/^(Prisavdrag|Gåva på köpet|NK Exklusiv|Kampanjpris)/i.test(line)) {
      promotionLabel = line;
      continue;
    }
    const match = line.match(/^(.{4,}?)\s+([\d\s]+)\s*kr(?:\s+([\d\s]+)\s*kr)?$/i);
    if (!match) continue;
    const price = numberFromSek(match[2]!);
    if (price == null) continue;
    const originalPrice = match[3] ? numberFromSek(match[3]) : null;
    const name = match[1]!.trim();
    const key = `${name}:${price}:${originalPrice ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      chain: 'nk_se',
      name,
      department,
      price,
      originalPrice,
      currency: 'SEK',
      isSale: originalPrice != null && originalPrice > price,
      promotionLabel,
      sourceUrl,
      retrievedAt
    });
  }

  return rows;
}

export async function fetchNkSeProducts(options: FetchNkSeProductsOptions = {}): Promise<NkSeProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: NkSeProduct[] = [];
  for (const path of options.sourcePaths ?? DEFAULT_NK_SE_SOURCE_PATHS) {
    const sourceUrl = absoluteUrl(path);
    const response = await fetchImpl(sourceUrl, { headers: { Accept: 'text/html' } });
    if (!response.ok) throw new Error(`NK request failed for ${sourceUrl}: ${response.status}`);
    rows.push(...parseNkSeProducts(await response.text(), sourceUrl, retrievedAt));
    if (options.maxRows && rows.length >= options.maxRows) return rows.slice(0, options.maxRows);
  }
  return rows;
}
