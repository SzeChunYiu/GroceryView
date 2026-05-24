export type SparNoPromotionRow = Readonly<{
  country: 'NO';
  currency: 'NOK';
  description?: string;
  name: string;
  price: number;
  sourceUrl: string;
}>;

type FetchLike = (input: string, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text: () => Promise<string>;
}>;

const flyerUrl = 'https://spar.no/erbjudanden';

export const sparNoFlyerConnector = {
  chain: 'Spar',
  country: 'NO',
  currency: 'NOK',
  id: 'spar-no-flyer',
  sourceUrl: flyerUrl,

  async fetchPromotions(fetcher: FetchLike = fetch): Promise<SparNoPromotionRow[]> {
    const response = await fetcher(flyerUrl, { headers: { accept: 'text/html' } });
    if (!response.ok) throw new Error(`Spar NO flyer fetch failed: ${response.status}`);

    return parseSparNoFlyer(await response.text(), flyerUrl);
  }
};

export function parseSparNoFlyer(html: string, sourceUrl = flyerUrl): SparNoPromotionRow[] {
  const blocks = [...html.matchAll(/<[^>]+class=["'][^"']*(?:offer|product|campaign)[^"']*["'][^>]*>([\s\S]*?)<\/[^>]+>/gi)];

  return blocks.flatMap((block) => {
    const text = block[1]
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const priceMatch = text.match(/(?:kr|NOK)\s*([0-9]+(?:[,.][0-9]{1,2})?)|([0-9]+(?:[,.][0-9]{1,2})?)\s*(?:kr|NOK)/i);
    const rawPrice = priceMatch?.[1] ?? priceMatch?.[2];
    if (!priceMatch || !rawPrice) return [];

    const name = text.slice(0, priceMatch.index).trim() || text.slice((priceMatch.index ?? 0) + priceMatch[0].length).trim();
    const price = Number(rawPrice.replace(',', '.'));
    if (!name || !Number.isFinite(price)) return [];

    return [{ country: 'NO', currency: 'NOK', name, price, sourceUrl }];
  });
}
