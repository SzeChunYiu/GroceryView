export type HeliosNoProduct = {
  country: 'NO';
  chainId: 'helios-no';
  category: 'health_food';
  articleNumber: string;
  name: string;
  descriptiveSize: string | null;
  sourceUrl: string;
};

export const HELIOS_NO_PRODUCTS_URL = 'https://www.helios.no/produkter/';
export const HELIOS_NO_VERIFIED_PRODUCT_COUNT = 130;

function unescapeJsonText(value: string): string {
  return value.replace(/\\u([0-9a-fA-F]{4})/g, (_match, code: string) => String.fromCharCode(Number.parseInt(code, 16)));
}

export function parseHeliosNoProducts(body: string, sourceUrl = HELIOS_NO_PRODUCTS_URL): HeliosNoProduct[] {
  const products = new Map<string, HeliosNoProduct>();
  const itemPattern = /"ArticleNumber":"([^"]+)"[^}]*},"Name":"([^"]+)"[^}]*?"DescriptiveSize":(null|"[^"]*")[^}]*?"Url":"([^"]+)"/g;

  for (const match of body.matchAll(itemPattern)) {
    const articleNumber = match[1]!;
    if (products.has(articleNumber)) continue;

    const descriptiveSize = match[3] === 'null' ? null : unescapeJsonText(match[3]!.slice(1, -1));
    products.set(articleNumber, {
      country: 'NO',
      chainId: 'helios-no',
      category: 'health_food',
      articleNumber,
      name: unescapeJsonText(match[2]!),
      descriptiveSize,
      sourceUrl: new URL(unescapeJsonText(match[4]!), sourceUrl).toString()
    });
  }

  return [...products.values()].sort((left, right) => left.articleNumber.localeCompare(right.articleNumber));
}

export async function fetchHeliosNoProducts(options: {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
} = {}): Promise<HeliosNoProduct[]> {
  const sourceUrl = options.sourceUrl ?? HELIOS_NO_PRODUCTS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView Helios NO health-food connector'
    }
  });
  if (!response.ok) throw new Error(`Helios NO product source failed with HTTP ${response.status}.`);
  return parseHeliosNoProducts(await response.text(), sourceUrl);
}
