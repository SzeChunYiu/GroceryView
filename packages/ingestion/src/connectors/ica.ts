export type IcaProduct = {
  code: string;
  name: string;
  brand: string;
  categories: string[];
  imageUrl: string;
  productUrl: string;
  dataPrice: string;
  sourceUrl: string;
  retrievedAt: string;
};

export const ICA_HANDLA_BASE_URL = 'https://handla.ica.se';

export const DEFAULT_ICA_HANDLA_PATHS = [
  '/',
  '/kategori/1',
  '/kategori/208',
  '/kategori/306',
  '/kategori/557',
  '/kategori/627',
  '/kategori/939',
  '/kategori/1627'
] as const;

export type FetchIcaProductsOptions = {
  fetchImpl?: typeof fetch;
  paths?: readonly string[];
  maxRows?: number;
  retrievedAt?: string;
};

export function buildIcaHandlaUrl(path: string): string {
  return new URL(path, ICA_HANDLA_BASE_URL).toString();
}

export async function fetchIcaProducts(options: FetchIcaProductsOptions = {}): Promise<IcaProduct[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const paths = options.paths ?? DEFAULT_ICA_HANDLA_PATHS;
  const maxRows = options.maxRows ?? 75;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const rows: IcaProduct[] = [];
  const seenCodes = new Set<string>();

  for (const path of paths) {
    const sourceUrl = buildIcaHandlaUrl(path);
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 (https://github.com/SzeChunYiu/GroceryView)'
      }
    });

    if (!response.ok) {
      throw new Error(`ICA handla request failed for ${path}: ${response.status}`);
    }

    for (const product of parseIcaProductCards(await response.text(), sourceUrl, retrievedAt)) {
      if (seenCodes.has(product.code)) {
        continue;
      }
      seenCodes.add(product.code);
      rows.push(product);
      if (rows.length >= maxRows) {
        return rows;
      }
    }
  }

  return rows;
}

export function parseIcaProductCards(html: string, sourceUrl: string, retrievedAt: string): IcaProduct[] {
  const rows: IcaProduct[] = [];
  const cardPattern = /<a([^>]*href="\/produkt\/\d+"[^>]*product-link[^>]*)>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(cardPattern)) {
    const attributes = match[1];
    const code = attribute(attributes, 'href').match(/\/produkt\/(\d+)/)?.[1] ?? '';
    const name = attribute(attributes, 'data-name') || attribute(attributes, 'title');
    const imageUrl = match[2].match(/<img[^>]+src="([^"]+)"/)?.[1] ?? '';
    if (!code || !name) {
      continue;
    }
    rows.push({
      code,
      name: decodeHtml(name),
      brand: decodeHtml(attribute(attributes, 'data-brand')),
      categories: parseCategories(attribute(attributes, 'data-categories')),
      imageUrl: absoluteIcaUrl(decodeHtml(imageUrl)),
      productUrl: buildIcaHandlaUrl(`/produkt/${code}`),
      dataPrice: decodeHtml(attribute(attributes, 'data-price')),
      sourceUrl,
      retrievedAt
    });
  }
  return rows;
}

function attribute(attributes: string, name: string): string {
  return attributes.match(new RegExp(`${name}="([^"]*)"`))?.[1] ?? '';
}

function parseCategories(value: string): string[] {
  const decoded = decodeHtml(value);
  if (!decoded) {
    return [];
  }
  try {
    const parsed = JSON.parse(decoded) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function absoluteIcaUrl(value: string): string {
  if (!value) {
    return '';
  }
  return value.startsWith('https://') ? value : new URL(value, ICA_HANDLA_BASE_URL).toString();
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}
