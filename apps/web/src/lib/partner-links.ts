const clickStorageKey = 'groceryview:partner-clicks';
const maxStoredClicks = 50;

const campaignParamNames = [
  'campaign',
  'utm_campaign',
  'utm_source',
  'utm_medium',
  'utm_content',
  'utm_term',
  'affiliate',
  'aff_id'
] as const;

const partnerUrlFields = [
  'checkoutUrl',
  'checkoutHref',
  'partnerUrl',
  'storeUrl',
  'sourceUrl',
  'externalUrl',
  'url'
] as const;

export type CampaignParams = URLSearchParams;

export type PartnerClickRecord = Readonly<{
  campaignParams: CampaignParams;
  destinationUrl: string;
  productName: string;
  productSlug: string;
}>;

function isValidCampaignValue(value: string) {
  return /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,63}$/.test(value);
}

function toExternalUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return url;
  } catch {
    return null;
  }
}

export function collectCampaignParams(search: string | URLSearchParams) {
  const source = typeof search === 'string'
    ? new URLSearchParams(search.startsWith('?') ? search.slice(1) : search)
    : search;
  const params = new URLSearchParams();

  campaignParamNames.forEach((name) => {
    const value = source.get(name)?.trim();
    if (value && isValidCampaignValue(value)) {
      params.set(name, value);
    }
  });

  return params;
}

export function appendCampaignParams(rawUrl: string, campaignParams: CampaignParams) {
  const url = toExternalUrl(rawUrl);
  if (!url) return null;

  campaignParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}

export function getPartnerLinkHref(source: Record<string, unknown>) {
  for (const field of partnerUrlFields) {
    const value = source[field];
    if (typeof value === 'string' && toExternalUrl(value)) {
      return value;
    }
  }

  return null;
}

export function persistPartnerClick({ campaignParams, destinationUrl, productName, productSlug }: PartnerClickRecord) {
  if (typeof window === 'undefined') return;

  try {
    const destination = toExternalUrl(destinationUrl);
    if (!destination) return;

    const previous = JSON.parse(window.localStorage.getItem(clickStorageKey) ?? '[]');
    const click = {
      campaignParams: Object.fromEntries(campaignParams.entries()),
      clickedAt: new Date().toISOString(),
      destinationHost: destination.host,
      destinationUrl: destination.toString(),
      productName,
      productSlug
    };
    const clicks = Array.isArray(previous) ? previous : [];

    window.localStorage.setItem(clickStorageKey, JSON.stringify([click, ...clicks].slice(0, maxStoredClicks)));
  } catch {
    // Best-effort analytics should never block checkout navigation.
  }
}
