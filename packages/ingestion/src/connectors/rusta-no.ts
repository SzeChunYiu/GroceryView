export const RUSTA_NO_CATEGORY_URLS = [
  'https://www.rusta.com/nb-no/kjokken-og-husholdning',
  'https://www.rusta.com/nb-no/fritid-og-reise/reise/reisetilbehor',
  'https://www.rusta.com/nb-no/fritid/hobby-og-handverk/garn'
] as const;

export type RustaNoProductObservation = {
  domain: 'variety_retail';
  chainId: 'rusta_no';
  country: 'NO';
  productName: string;
  sku: string;
  categoryName: string;
  position: number;
  price: number;
  currency: 'NOK';
  availability: string;
  productUrl: string;
  sourceUrl: string;
  capturedAt: string;
  provenance: {
    source: 'rusta_no_json_ld_product_list';
    parserVersion: 'rusta-no-jsonld-v1';
    originalPrice: string;
  };
};

type JsonLdOffer = {
  price?: unknown;
  priceCurrency?: unknown;
  availability?: unknown;
};

type JsonLdProduct = {
  name?: unknown;
  sku?: unknown;
  offers?: unknown;
};

type JsonLdListItem = {
  item?: JsonLdProduct;
  position?: unknown;
  url?: unknown;
};

type JsonLdProductList = {
  name?: unknown;
  mainEntity?: {
    itemListElement?: unknown;
  };
};

export async function fetchRustaNoProducts(options: {
  fetchImpl?: typeof fetch;
  categoryUrls?: readonly string[];
  capturedAt?: string;
} = {}): Promise<RustaNoProductObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const categoryUrls = options.categoryUrls ?? RUSTA_NO_CATEGORY_URLS;
  const rows: RustaNoProductObservation[] = [];

  for (const sourceUrl of categoryUrls) {
    const response = await fetchImpl(sourceUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'GroceryView/0.1 Rusta Norway connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`Rusta Norway source blocked with HTTP ${response.status}: ${sourceUrl}`);
    }
    if (!response.ok) throw new Error(`Rusta Norway source failed with HTTP ${response.status}: ${sourceUrl}`);
    rows.push(...parseRustaNoProductListingPage(await response.text(), { sourceUrl, capturedAt }));
  }

  return rows;
}

export function parseRustaNoProductListingPage(
  html: string,
  context: { sourceUrl: string; capturedAt: string }
): RustaNoProductObservation[] {
  const productLists = extractJsonLd(html)
    .map((node) => node as JsonLdProductList)
    .filter((node) => Array.isArray(node.mainEntity?.itemListElement));

  return productLists.flatMap((list) => {
    const categoryName = typeof list.name === 'string' ? list.name : categoryNameFromUrl(context.sourceUrl);
    return (list.mainEntity?.itemListElement as JsonLdListItem[]).flatMap((entry) => {
      const product = entry.item;
      const offer = firstOffer(product?.offers);
      if (!product || !offer || typeof product.name !== 'string' || typeof product.sku !== 'string') return [];
      if (typeof offer.price !== 'string' && typeof offer.price !== 'number') return [];
      if (offer.priceCurrency !== 'NOK') return [];
      const price = parseNorwegianPrice(String(offer.price));
      return [{
        domain: 'variety_retail',
        chainId: 'rusta_no',
        country: 'NO',
        productName: product.name,
        sku: product.sku,
        categoryName,
        position: typeof entry.position === 'number' ? entry.position : 0,
        price,
        currency: 'NOK',
        availability: typeof offer.availability === 'string' ? offer.availability : '',
        productUrl: typeof entry.url === 'string' ? entry.url : '',
        sourceUrl: context.sourceUrl,
        capturedAt: context.capturedAt,
        provenance: {
          source: 'rusta_no_json_ld_product_list',
          parserVersion: 'rusta-no-jsonld-v1',
          originalPrice: String(offer.price)
        }
      }];
    });
  });
}

function extractJsonLd(html: string): unknown[] {
  const nodes: unknown[] = [];
  const pattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(pattern)) {
    try {
      nodes.push(JSON.parse(match[1]!.trim()));
    } catch {
      // Ignore unrelated malformed structured-data blocks.
    }
  }
  return nodes;
}

function firstOffer(value: unknown): JsonLdOffer | null {
  if (Array.isArray(value)) return value[0] as JsonLdOffer ?? null;
  return value && typeof value === 'object' ? value as JsonLdOffer : null;
}

function parseNorwegianPrice(value: string): number {
  const parsed = Number.parseFloat(value.replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Rusta Norway price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function categoryNameFromUrl(sourceUrl: string): string {
  const parts = sourceUrl.split('/').filter(Boolean);
  const slug = parts[parts.length - 1] ?? 'rusta-no';
  return decodeURIComponent(slug).replace(/-/g, ' ');
}
