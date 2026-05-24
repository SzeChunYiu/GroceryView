export type KrambudinIsProduct = Readonly<{
  currency: 'ISK';
  name: string;
  price: number;
  sourceUrl: string;
}>;

type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

const baseUrl = 'https://krambudin.is';

export const krambudinIsConnector = {
  baseUrl,
  chain: 'Krambúðin',
  country: 'IS',
  id: 'krambudin-is',
  kind: 'convenience',

  async fetchProducts(fetcher: FetchLike = fetch): Promise<KrambudinIsProduct[]> {
    const response = await fetcher(baseUrl, { headers: { accept: 'text/html' } });
    if (!response.ok) throw new Error(`Krambúðin fetch failed: ${response.status}`);

    return parseKrambudinIsProducts(await response.text(), baseUrl);
  }
};

export function parseKrambudinIsProducts(html: string, sourceUrl = baseUrl): KrambudinIsProduct[] {
  const productBlocks = [...html.matchAll(/<[^>]+class=["'][^"']*product[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];

  return productBlocks.flatMap((block) => {
    const text = block[1]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const priceMatch = text.match(/([0-9][0-9. ]*)\s*(?:kr\.?|ISK)/i);
    if (!priceMatch) return [];

    const name = text.slice(0, priceMatch.index).trim();
    const price = Number(priceMatch[1].replace(/[.\s]/g, ''));
    if (!name || !Number.isFinite(price)) return [];

    return [{ currency: 'ISK', name, price, sourceUrl }];
  });
}
