export type BonusIsOffer = {
  chain: 'bonus-is';
  country: 'IS';
  code: string;
  name: string;
  price: number;
  currency: 'ISK';
  productUrl: string;
  sourceUrl: string;
};

export function parseBonusIsOffers(html: string, sourceUrl: string): BonusIsOffer[] {
  const rows: BonusIsOffer[] = [];
  for (const match of html.matchAll(/data-product-id=["']([^"']+)["'][^>]*data-name=["']([^"']+)["'][^>]*data-price=["']([^"']+)["'][^>]*data-url=["']([^"']+)["']/g)) {
    const price = parseIcelandicPrice(match[3]);
    if (price === null) continue;
    rows.push({
      chain: 'bonus-is',
      country: 'IS',
      code: decodeHtml(match[1]),
      name: decodeHtml(match[2]),
      price,
      currency: 'ISK',
      productUrl: new URL(decodeHtml(match[4]), sourceUrl).toString(),
      sourceUrl
    });
  }
  return rows;
}

export async function fetchBonusIsOffers(fetchImpl: typeof fetch, sourceUrl: string): Promise<BonusIsOffer[]> {
  const response = await fetchImpl(sourceUrl, { headers: { accept: 'text/html,application/xhtml+xml' } });
  if (!response.ok) throw new Error(`Bonus IS request failed: ${response.status}`);
  return parseBonusIsOffers(await response.text(), sourceUrl);
}

function parseIcelandicPrice(value: string): number | null {
  const normalized = decodeHtml(value).replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function decodeHtml(value: string): string {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
