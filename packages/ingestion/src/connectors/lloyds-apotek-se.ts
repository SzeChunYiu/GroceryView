export const LLOYDS_APOTEK_SE_HOME_URL = 'https://www.lloydsapotek.se/';
export const LLOYDS_APOTEK_SE_CANONICAL_HOME_URL = 'https://dozapotek.se/';
export const LLOYDS_APOTEK_SE_CAMPAIGNS_URL = 'https://dozapotek.se/aktuella-kampanjer';

export type LloydsApotekSeChannel = 'online';

export type LloydsApotekSeMultiBuy = {
  quantity: number;
  totalPrice?: number;
  payForQuantity?: number;
  text: string;
};

export type LloydsApotekSePriceRow = {
  chainId: 'lloyds_apotek_se';
  sourceUrl: string;
  productName: string;
  channel: LloydsApotekSeChannel;
  currency: 'SEK';
  price?: number;
  regularPrice?: number;
  is_campaign_price?: true;
  multi_buy?: LloydsApotekSeMultiBuy;
};

export function parseLloydsApotekSeCampaignRows(input: { body: string; sourceUrl?: string }): LloydsApotekSePriceRow[] {
  const sourceUrl = input.sourceUrl ?? LLOYDS_APOTEK_SE_CAMPAIGNS_URL;
  const lines = visibleLines(input.body);
  const rows: LloydsApotekSePriceRow[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    const campaign = line.match(/^Kampanjpris\s+([0-9]+(?:,[0-9]{1,2})?)\s*kr\s+Ord\.pris\s+([0-9]+(?:,[0-9]{1,2})?)\s*kr$/i);
    if (campaign) {
      const productName = previousProductLine(lines, index);
      if (productName) {
        rows.push({
          chainId: 'lloyds_apotek_se',
          sourceUrl,
          productName,
          channel: 'online',
          currency: 'SEK',
          price: parseSek(campaign[1]!),
          regularPrice: parseSek(campaign[2]!),
          is_campaign_price: true
        });
      }
      continue;
    }

    const multiBuy = parseMultiBuy(line);
    if (multiBuy) {
      const productName = previousProductLine(lines, index);
      if (productName) {
        rows.push({
          chainId: 'lloyds_apotek_se',
          sourceUrl,
          productName,
          channel: 'online',
          currency: 'SEK',
          multi_buy: multiBuy
        });
      }
    }
  }

  return rows;
}

export async function fetchLloydsApotekSeCampaignRows(options: {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
} = {}): Promise<LloydsApotekSePriceRow[]> {
  const sourceUrl = options.sourceUrl ?? LLOYDS_APOTEK_SE_CAMPAIGNS_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 Lloyds Apotek SE connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Lloyds Apotek SE campaign source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`Lloyds Apotek SE campaign source failed with HTTP ${response.status}.`);
  return parseLloydsApotekSeCampaignRows({ body: await response.text(), sourceUrl });
}

function parseMultiBuy(line: string): LloydsApotekSeMultiBuy | null {
  const priceMatch = line.match(/^(\d+)\s+för\s+([0-9]+)\s*(?::\-|kr)$/i);
  if (priceMatch) {
    return {
      quantity: Number(priceMatch[1]),
      totalPrice: Number(priceMatch[2]),
      text: line
    };
  }
  const payForMatch = line.match(/^(\d+)\s+för\s+(\d+)(?:\s+på\s+.+)?$/i);
  if (payForMatch) {
    return {
      quantity: Number(payForMatch[1]),
      payForQuantity: Number(payForMatch[2]),
      text: line
    };
  }
  return null;
}

function previousProductLine(lines: string[], beforeIndex: number): string | null {
  for (let index = beforeIndex - 1; index >= 0; index -= 1) {
    const line = lines[index]!;
    if (/^(Läkemedel|Läs bipacksedeln|x|shopping-cart|Köp|Gör ett klipp!|Filter|Laddar|close\d*)$/i.test(line)) continue;
    if (/^(Kampanjpris|Ord\.pris)/i.test(line)) continue;
    if (/^\*+$/.test(line)) continue;
    return line;
  }
  return null;
}

function visibleLines(html: string): string[] {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>|<\/(?:p|div|li|h\d|td|th|a)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseSek(value: string): number {
  const parsed = Number(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`Invalid Lloyds Apotek SE price: ${value}`);
  return Math.round((parsed + Number.EPSILON) * 100) / 100;
}
