export type HalsaSkonhetSeProduct = Readonly<{
  category: 'health_food';
  chain: 'Life';
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

const sourceUrl = 'https://www.lifebutiken.se';

export const halsaSkonhetSeConnector = {
  category: 'health_food',
  chain: 'Life',
  country: 'SE',
  currency: 'SEK',
  id: 'halsa-skonhet-se',
  segment: 'hälsa & skönhet butik',
  sourceUrl,

  async fetchProducts(fetcher: FetchLike = fetch): Promise<HalsaSkonhetSeProduct[]> {
    const response = await fetcher(sourceUrl, { headers: { accept: 'text/html' } });
    if (!response.ok) throw new Error(`Life SE fetch failed: ${response.status}`);

    return parseHalsaSkonhetSeProducts(await response.text(), sourceUrl);
  }
};

export function parseHalsaSkonhetSeProducts(html: string, pageUrl = sourceUrl): HalsaSkonhetSeProduct[] {
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

    return [{ category: 'health_food', chain: 'Life', country: 'SE', currency: 'SEK', name, price, sourceUrl: pageUrl }];
  });
}
