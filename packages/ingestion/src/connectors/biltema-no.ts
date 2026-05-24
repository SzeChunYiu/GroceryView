const DEFAULT_URL = 'https://www.biltema.no/en-no/home/';
const BASE_URL = 'https://www.biltema.no';

type FetchLike = (input: string | URL, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export type BiltemaNoHouseholdProduct = {
  chain: 'biltema';
  country: 'NO';
  currency: 'NOK';
  category: 'household';
  sku: string;
  name: string;
  price: number;
  previousPrice?: number;
  categoryPath?: string;
  imageUrl?: string;
  productUrl?: string;
};

type BiltemaProductCard = {
  articleNumber?: string;
  name?: string;
  imageUrl?: string;
  url?: string;
  priceIncVAT?: string;
  previousPrice?: string;
  analyticsProductEntity?: { categoryHierarchy?: string };
};

export type FetchBiltemaNoOptions = {
  fetchImpl?: FetchLike;
  url?: string;
};

export async function fetchBiltemaNoHousehold(
  options: FetchBiltemaNoOptions = {}
): Promise<BiltemaNoHouseholdProduct[]> {
  const fetchImpl = options.fetchImpl ?? ((globalThis as { fetch: FetchLike }).fetch);
  const response = await fetchImpl(options.url ?? DEFAULT_URL, { headers: { accept: 'text/html' } });
  if (!response.ok) throw new Error(`Biltema NO household request failed: ${response.status}`);
  return extractBiltemaNoHouseholdProducts(await response.text());
}

export function extractBiltemaNoHouseholdProducts(html: string): BiltemaNoHouseholdProduct[] {
  const rows: BiltemaNoHouseholdProduct[] = [];
  const matches = html.matchAll(/\{"productId":null,"name":.*?"hasPant":false\}/g);

  for (const match of matches) {
    const card = safeJson(match[0]);
    if (!card) continue;
    const row = normalizeBiltemaNoProduct(card);
    if (row) rows.push(row);
  }

  return rows;
}

export function normalizeBiltemaNoProduct(card: BiltemaProductCard): BiltemaNoHouseholdProduct | null {
  const sku = card.articleNumber;
  const name = card.name;
  const price = parseBiltemaPrice(card.priceIncVAT);
  if (!sku || !name || price === undefined) return null;

  return {
    chain: 'biltema',
    country: 'NO',
    currency: 'NOK',
    category: 'household',
    sku,
    name,
    price,
    previousPrice: parseBiltemaPrice(card.previousPrice),
    categoryPath: card.analyticsProductEntity?.categoryHierarchy,
    imageUrl: card.imageUrl,
    productUrl: card.url ? new URL(card.url, BASE_URL).toString() : undefined
  };
}

function safeJson(raw: string): BiltemaProductCard | null {
  try {
    return JSON.parse(raw) as BiltemaProductCard;
  } catch {
    return null;
  }
}

function parseBiltemaPrice(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
