export type BodyShopSeProduct = Readonly<{
  category: 'cosmetics';
  country: 'SE';
  currency: 'SEK';
  name: string;
  price: number;
  sourceUrl: string;
}>;

type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

const sourceUrl = 'https://www.thebodyshop.com/sv-se';

export const bodyShopSeConnector = {
  category: 'cosmetics',
  country: 'SE',
  currency: 'SEK',
  id: 'bodyshop-se',
  sourceUrl,

  async fetchProducts(fetcher: FetchLike = fetch): Promise<BodyShopSeProduct[]> {
    const response = await fetcher(sourceUrl, { headers: { accept: 'text/html' } });
    if (!response.ok) throw new Error(`Body Shop SE fetch failed: ${response.status}`);

    return parseBodyShopSeProducts(await response.text(), sourceUrl);
  }
};

export function parseBodyShopSeProducts(html: string, pageUrl = sourceUrl): BodyShopSeProduct[] {
  const blocks = [...html.matchAll(/<[^>]+class=["'][^"']*(?:product|tile|card)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];

  return blocks.flatMap((block) => {
    const text = block[1]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const priceMatch = text.match(/([0-9]+(?:[,.][0-9]{1,2})?)\s*(?:kr|SEK)/i);
    if (!priceMatch) return [];

    const name = text.slice(0, priceMatch.index).trim();
    const price = Number(priceMatch[1].replace(',', '.'));
    if (!name || !Number.isFinite(price)) return [];

    return [{ category: 'cosmetics', country: 'SE', currency: 'SEK', name, price, sourceUrl: pageUrl }];
  });
}
