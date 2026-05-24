export type AtlantsoliaFuelQuirkRow = {
  country: 'IS';
  chainId: 'atlantsolia';
  productScope: 'fuel';
  channel: 'store';
  loyaltyProgram: 'Dælulykill/applykill';
  isMemberPrice: true;
  discountPerLitre: number;
  currency: 'ISK';
  excludedFormats: string[];
  sourceUrl: string;
  capturedAt: string;
};

export const ATLANTSOLIA_DAELULYKILL_DISCOUNT_URL = 'https://www.atlantsolia.is/daelulykill/afslattur-og-allskonar/';
export const ATLANTSOLIA_FUEL_QUIRK_PARSER_VERSION = 'atlantsolia-is-fuel-quirks-v1';

function decodeIcelandicHtml(value: string): string {
  return value
    .replace(/&aacute;/g, 'á')
    .replace(/&iacute;/g, 'í')
    .replace(/&eth;/g, 'ð')
    .replace(/&thorn;/g, 'þ')
    .replace(/&ouml;/g, 'ö')
    .replace(/&nbsp;/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseAtlantsoliaFuelPricingQuirks(input: {
  body: string;
  sourceUrl?: string;
  capturedAt: string;
}): AtlantsoliaFuelQuirkRow[] {
  const text = decodeIcelandicHtml(input.body);
  const discountMatch = text.match(/(?:Dælulykilinn og applykilinn gefa|gefa)\s+(\d+)\s+kr\s+afslátt/i);
  if (!discountMatch) return [];

  const excludedFormats = /Bensínsprengjustöðvunum/i.test(text) ? ['Bensínsprengjustöðvar'] : [];

  return [{
    country: 'IS',
    chainId: 'atlantsolia',
    productScope: 'fuel',
    channel: 'store',
    loyaltyProgram: 'Dælulykill/applykill',
    isMemberPrice: true,
    discountPerLitre: Number(discountMatch[1]),
    currency: 'ISK',
    excludedFormats,
    sourceUrl: input.sourceUrl ?? ATLANTSOLIA_DAELULYKILL_DISCOUNT_URL,
    capturedAt: input.capturedAt
  }];
}

export async function fetchAtlantsoliaFuelPricingQuirks(options: {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  capturedAt?: string;
} = {}): Promise<AtlantsoliaFuelQuirkRow[]> {
  const sourceUrl = options.sourceUrl ?? ATLANTSOLIA_DAELULYKILL_DISCOUNT_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView Atlantsolia fuel quirk study'
    }
  });
  if (!response.ok) throw new Error(`Atlantsolía fuel quirk source failed with HTTP ${response.status}.`);

  return parseAtlantsoliaFuelPricingQuirks({
    body: await response.text(),
    sourceUrl,
    capturedAt: options.capturedAt ?? new Date().toISOString()
  });
}
