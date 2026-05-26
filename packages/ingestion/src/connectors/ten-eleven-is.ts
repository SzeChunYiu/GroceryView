export const TEN_ELEVEN_IS_HOME_URL = 'https://www.10-11.is/';

export type TenElevenIsStore = {
  chain: 'ten-eleven-is';
  country: 'IS';
  store_id: string;
  name: string;
  address: string;
  openingHours: string;
  sourceUrl: string;
  retrievedAt: string;
};

export type TenElevenIsPricingStudyStatus = {
  chain: 'ten-eleven-is';
  country: 'IS';
  sourceUrl: string;
  retrievedAt: string;
  status: 'official_site_locations_only_no_verifiable_product_prices';
  stores: TenElevenIsStore[];
  codifiedPricingQuirks: [];
  priceRows: [];
  evidence: string[];
};

type StoreDefinition = {
  store_id: string;
  name: string;
  address: string;
  marker: string;
  openingHours: string;
};

const TEN_ELEVEN_IS_STORES: readonly StoreDefinition[] = [
  {
    store_id: 'ten-eleven-is-laugavegur-hlemmur',
    name: '10-11 Laugavegur',
    address: 'Laugavegur, á móti Hlemmi',
    marker: 'Laugavegur',
    openingHours: 'Verslun 24/7'
  },
  {
    store_id: 'ten-eleven-is-skolavordustigur-42',
    name: '10-11 Skólavörðustígur 42',
    address: 'Skólavörðustígur 42',
    marker: 'Skólavörðustígur 42',
    openingHours: 'Virka daga: 8-23.30; Helgar: 9-23.30'
  },
  {
    store_id: 'ten-eleven-is-austurstraeti',
    name: '10-11 Austurstræti',
    address: 'Austurstræti, í göngugötu',
    marker: 'Austurstræti',
    openingHours: 'Verslun 24/7'
  }
];

export async function fetchTenElevenIsPricingStudyStatus(options: {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  retrievedAt?: string;
} = {}): Promise<TenElevenIsPricingStudyStatus> {
  const sourceUrl = options.sourceUrl ?? TEN_ELEVEN_IS_HOME_URL;
  const response = await (options.fetchImpl ?? fetch)(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView/0.1 ten-eleven-is-connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`10-11 IS official site request failed with HTTP ${response.status}.`);
  return parseTenElevenIsPricingStudyStatus(
    await response.text(),
    options.retrievedAt ?? new Date().toISOString(),
    sourceUrl
  );
}

export function parseTenElevenIsPricingStudyStatus(
  html: string,
  retrievedAt: string,
  sourceUrl = TEN_ELEVEN_IS_HOME_URL
): TenElevenIsPricingStudyStatus {
  const visibleText = htmlToText(html);
  const stores = TEN_ELEVEN_IS_STORES
    .filter((store) => visibleText.includes(store.marker))
    .map((store): TenElevenIsStore => ({
      chain: 'ten-eleven-is',
      country: 'IS',
      store_id: store.store_id,
      name: store.name,
      address: store.address,
      openingHours: store.openingHours,
      sourceUrl,
      retrievedAt
    }));

  return {
    chain: 'ten-eleven-is',
    country: 'IS',
    sourceUrl,
    retrievedAt,
    status: 'official_site_locations_only_no_verifiable_product_prices',
    stores,
    codifiedPricingQuirks: [],
    priceRows: [],
    evidence: [
      'The official 10-11 homepage lists store locations and opening hours.',
      'The checked official source does not expose product, price, loyalty, coupon, subscription, clearance, multi-buy, counter, or B2B consumer price rows for this connector to emit.'
    ]
  };
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
