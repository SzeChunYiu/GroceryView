export const HELIOS_NO_PRODUCTS_URL = 'https://www.helios.no/produkter/';
export const HELIOS_NO_PARSER_VERSION = 'helios-no-content-viewmodel-v1';
export const HELIOS_NO_OBSERVED_UNIQUE_ARTICLE_COUNT = 130;

export type HeliosNoProduct = {
  country: 'NO';
  currency: 'NOK';
  chain: 'helios-no';
  retailerType: 'health_food';
  code: string;
  articleNumber: string;
  entityId: string;
  name: string;
  description: string;
  descriptiveSize: string;
  categoryId: string;
  categoryName: string;
  price: null;
  priceText: '';
  available: boolean;
  productUrl: string;
  imageUrl: string;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    source: 'helios_official_product_catalogue';
    parserVersion: string;
    catalogueEntryCount: number;
    uniqueArticleCount: number;
  };
};

export type HeliosNoCatalogueStatus = {
  chain: 'helios-no';
  chainName: 'Helios';
  country: 'NO';
  retailerType: 'health_food';
  status: 'verified_official_product_catalogue_no_prices';
  qualifiesForOnlinePriceConnector: false;
  observedUniqueArticleCount: number;
  evidence: Array<{
    kind: 'official_site' | 'embedded_catalogue';
    label: string;
    sourceUrl: string;
  }>;
  caveat: string;
};

export type FetchHeliosNoProductsOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
  maxRows?: number;
};

type HeliosNoViewModel = {
  Groups?: unknown;
  Items?: unknown;
};

type HeliosNoRawGroup = {
  ID?: unknown;
  Name?: unknown;
  Url?: unknown;
};

type HeliosNoRawItem = {
  Data?: {
    ArticleNumber?: unknown;
    EntityId?: unknown;
  } | null;
  Name?: unknown;
  Description?: unknown;
  DescriptiveSize?: unknown;
  Image?: unknown;
  Url?: unknown;
  GroupID?: unknown;
  IsDiscontinued?: unknown;
};

export const HELIOS_NO_CATALOGUE_STATUS: HeliosNoCatalogueStatus = {
  chain: 'helios-no',
  chainName: 'Helios',
  country: 'NO',
  retailerType: 'health_food',
  status: 'verified_official_product_catalogue_no_prices',
  qualifiesForOnlinePriceConnector: false,
  observedUniqueArticleCount: HELIOS_NO_OBSERVED_UNIQUE_ARTICLE_COUNT,
  evidence: [
    {
      kind: 'official_site',
      label: 'Helios.no presents Helios as an organic food product catalogue for Norway.',
      sourceUrl: HELIOS_NO_PRODUCTS_URL
    },
    {
      kind: 'embedded_catalogue',
      label: 'The products page embeds 143 product-card entries with 130 unique article numbers across 15 categories when checked for this connector.',
      sourceUrl: HELIOS_NO_PRODUCTS_URL
    }
  ],
  caveat: 'Helios.no is an official brand catalogue rather than a direct retailer checkout, so the connector emits assortment rows with null prices and preserves article numbers for downstream price matching.'
};

export async function fetchHeliosNoProducts(options: FetchHeliosNoProductsOptions = {}): Promise<HeliosNoProduct[]> {
  const sourceUrl = options.sourceUrl ?? HELIOS_NO_PRODUCTS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 helios-no-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Helios NO source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Helios NO source failed with HTTP ${response.status}.`);

  const rows = parseHeliosNoProducts(await response.text(), options.retrievedAt ?? new Date().toISOString(), sourceUrl);
  return options.maxRows ? rows.slice(0, options.maxRows) : rows;
}

export function parseHeliosNoProducts(
  html: string,
  retrievedAt: string,
  sourceUrl = HELIOS_NO_PRODUCTS_URL
): HeliosNoProduct[] {
  const viewModel = extractHeliosNoViewModel(html);
  const groups = new Map<string, HeliosNoRawGroup>();
  for (const group of asArray(viewModel.Groups)) {
    const groupRecord = group as HeliosNoRawGroup;
    const id = text(groupRecord.ID);
    if (id) groups.set(id, groupRecord);
  }

  const items = asArray(viewModel.Items);
  const uniqueArticleCount = new Set(items.map((item) => articleNumber(item as HeliosNoRawItem)).filter(Boolean)).size;
  const seen = new Set<string>();
  const rows: HeliosNoProduct[] = [];

  for (const item of items) {
    const product = normalizeHeliosNoProduct(item as HeliosNoRawItem, groups, sourceUrl, retrievedAt, items.length, uniqueArticleCount);
    if (!product || seen.has(product.articleNumber)) continue;
    seen.add(product.articleNumber);
    rows.push(product);
  }

  if (rows.length === 0) throw new Error('Helios NO catalogue had no usable product rows.');
  return rows;
}

export function verifyHeliosNoCatalogueStatus(): HeliosNoCatalogueStatus {
  return HELIOS_NO_CATALOGUE_STATUS;
}

function normalizeHeliosNoProduct(
  item: HeliosNoRawItem,
  groups: Map<string, HeliosNoRawGroup>,
  sourceUrl: string,
  retrievedAt: string,
  catalogueEntryCount: number,
  uniqueArticleCount: number
): HeliosNoProduct | null {
  const article = articleNumber(item);
  const name = text(item.Name);
  const productPath = text(item.Url);
  if (!article || !name || !productPath) return null;

  const groupId = text(item.GroupID);
  const group = groups.get(groupId);
  const entityId = text(item.Data?.EntityId);

  return {
    country: 'NO',
    currency: 'NOK',
    chain: 'helios-no',
    retailerType: 'health_food',
    code: `helios-no:${article}`,
    articleNumber: article,
    entityId,
    name,
    description: text(item.Description),
    descriptiveSize: text(item.DescriptiveSize),
    categoryId: groupId,
    categoryName: text(group?.Name),
    price: null,
    priceText: '',
    available: item.IsDiscontinued !== true,
    productUrl: absoluteUrl(productPath, sourceUrl),
    imageUrl: absoluteUrl(text(item.Image), sourceUrl),
    sourceUrl,
    retrievedAt,
    provenance: {
      source: 'helios_official_product_catalogue',
      parserVersion: HELIOS_NO_PARSER_VERSION,
      catalogueEntryCount,
      uniqueArticleCount
    }
  };
}

function extractHeliosNoViewModel(html: string): HeliosNoViewModel {
  const match = html.match(/\$contentViewModel\.init\((\{[\s\S]*?\})\);/);
  if (!match) throw new Error('Helios NO content view model not found.');
  try {
    return JSON.parse(match[1]) as HeliosNoViewModel;
  } catch (error) {
    throw new Error(`Helios NO content view model could not be parsed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function articleNumber(item: HeliosNoRawItem): string {
  return text(item.Data?.ArticleNumber);
}

function absoluteUrl(value: string, baseUrl: string): string {
  return value ? new URL(value, baseUrl).toString() : '';
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  if (typeof value === 'string') return decodeHtml(value.trim());
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
}

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}
