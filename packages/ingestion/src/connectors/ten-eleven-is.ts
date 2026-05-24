import { createHash } from 'node:crypto';

export const TEN_ELEVEN_IS_SOURCE_URL = 'https://www.10-11.is/';
export const TEN_ELEVEN_IS_PARSER_VERSION = 'ten-eleven-is-store-study-v1';

export type TenElevenIsStoreRow = {
  chainId: 'ten-eleven-is';
  storeId: string;
  name: '10-11';
  address: string;
  region: 'capital-region';
  countryCode: 'IS';
  format: 'convenience';
  channel: 'store';
  openingHours: string;
  pricingQuirks: {
    hasPublishedOnlinePrices: false;
    hasMemberPrice: false;
    hasSubscriptionPrice: false;
    hasCouponPrice: false;
    hasClearancePrice: false;
    hasMultiBuy: false;
    hasCounterPrice: false;
    hasB2BPrice: false;
  };
  provenance: {
    sourceUrl: string;
    capturedAt: string;
    parserVersion: string;
    contentDigest: {
      algorithm: 'sha-256';
      value: string;
    };
  };
};

export type FetchTenElevenIsStoresOptions = {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
};

const STORE_MATCHERS: Array<{
  storeId: string;
  address: string;
  label: RegExp;
  nextLabel?: RegExp;
}> = [
  { storeId: 'ten-eleven-is-laugavegur-hlemmur', address: 'Laugavegur á móti Hlemmi', label: /Laugavegur\s+á\s+móti\s+Hlemmi/i, nextLabel: /Skólavörðustígur\s+42/i },
  { storeId: 'ten-eleven-is-skolavordustigur-42', address: 'Skólavörðustígur 42', label: /Skólavörðustígur\s+42/i, nextLabel: /Austurstræti\s+í\s+göngugötu/i },
  { storeId: 'ten-eleven-is-austurstraeti', address: 'Austurstræti í göngugötu', label: /Austurstræti\s+í\s+göngugötu/i }
];

const NO_PUBLIC_PRICE_QUIRKS: TenElevenIsStoreRow['pricingQuirks'] = {
  hasPublishedOnlinePrices: false,
  hasMemberPrice: false,
  hasSubscriptionPrice: false,
  hasCouponPrice: false,
  hasClearancePrice: false,
  hasMultiBuy: false,
  hasCounterPrice: false,
  hasB2BPrice: false
};

export async function fetchTenElevenIsStores(options: FetchTenElevenIsStoresOptions = {}): Promise<TenElevenIsStoreRow[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? TEN_ELEVEN_IS_SOURCE_URL;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 chain-study-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });

  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`10-11 IS source blocked with HTTP ${response.status}.`);
  }
  if (!response.ok) throw new Error(`10-11 IS source failed with HTTP ${response.status}.`);

  return parseTenElevenIsStores(await response.text(), { sourceUrl, capturedAt });
}

export function parseTenElevenIsStores(
  html: string,
  context: {
    sourceUrl?: string;
    capturedAt: string;
  }
): TenElevenIsStoreRow[] {
  const sourceUrl = context.sourceUrl ?? TEN_ELEVEN_IS_SOURCE_URL;
  const text = decodeHtmlText(html);
  const digest = createHash('sha256').update(html).digest('hex');

  return STORE_MATCHERS.map((store) => {
    const openingHours = openingHoursForStore(text, store);
    return {
      chainId: 'ten-eleven-is',
      storeId: store.storeId,
      name: '10-11',
      address: store.address,
      region: 'capital-region',
      countryCode: 'IS',
      format: 'convenience',
      channel: 'store',
      openingHours,
      pricingQuirks: NO_PUBLIC_PRICE_QUIRKS,
      provenance: {
        sourceUrl,
        capturedAt: context.capturedAt,
        parserVersion: TEN_ELEVEN_IS_PARSER_VERSION,
        contentDigest: {
          algorithm: 'sha-256',
          value: digest
        }
      }
    };
  });
}

function openingHoursForStore(text: string, store: typeof STORE_MATCHERS[number]): string {
  const start = matchIndex(text, store.label, store.address);
  const end = store.nextLabel ? matchIndex(text, store.nextLabel, store.address) : text.length;
  const segment = text.slice(start, end);
  const match = segment.match(/Opnunartímar:\s+Verslun\s+(.+?)(?:\s+Sbarro|\s+Bæjarins|\s+Skoða á korti|$)/i);
  if (!match) throw new Error(`10-11 opening hours missing for ${store.address}.`);
  return match[1].trim();
}

function matchIndex(text: string, pattern: RegExp, label: string): number {
  const match = text.match(pattern);
  if (!match || match.index === undefined) throw new Error(`10-11 source section missing: ${label}.`);
  return match.index;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 16)))
    .replace(/&#([0-9]+);/g, (_, value: string) => String.fromCodePoint(Number.parseInt(value, 10)))
    .replace(/&THORN;/g, 'Þ')
    .replace(/&thorn;/g, 'þ')
    .replace(/&ETH;/g, 'Ð')
    .replace(/&eth;/g, 'ð')
    .replace(/&aacute;/g, 'á')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&ouml;/g, 'ö')
    .replace(/&Ouml;/g, 'Ö')
    .replace(/&uacute;/g, 'ú')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&aelig;/g, 'æ')
    .replace(/&AElig;/g, 'Æ')
    .replace(/\u200b/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
