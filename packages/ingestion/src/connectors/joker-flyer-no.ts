const DEFAULT_ENDPOINT = 'https://joker.no/api/kundeavis';
const DEFAULT_POST_CODE = '0150';

type FetchLike = (input: string | URL, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

export type JokerFlyerNoPromotionRow = {
  chain: 'joker';
  country: 'NO';
  currency: 'NOK';
  source: 'joker.no/kundeavis';
  promotionType: 'weekly_flyer';
  postCode: string;
  flyerUrl: string;
  validFrom?: string;
  validTo?: string;
};

type JokerFlyerResponse = {
  url?: unknown;
  validFrom?: unknown;
  validTo?: unknown;
};

export type FetchJokerFlyerNoOptions = {
  endpoint?: string;
  fetchImpl?: FetchLike;
  postCode?: string;
};

export async function fetchJokerFlyerNo(options: FetchJokerFlyerNoOptions = {}): Promise<JokerFlyerNoPromotionRow[]> {
  const fetchImpl = options.fetchImpl ?? ((globalThis as { fetch: FetchLike }).fetch);
  const postCode = options.postCode ?? DEFAULT_POST_CODE;
  const url = new URL(options.endpoint ?? DEFAULT_ENDPOINT);
  url.searchParams.set('postCode', postCode);

  const response = await fetchImpl(url, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Joker flyer request failed: ${response.status}`);

  return normalizeJokerFlyerNoResponse((await response.json()) as JokerFlyerResponse, postCode);
}

export function normalizeJokerFlyerNoResponse(
  payload: JokerFlyerResponse,
  postCode = DEFAULT_POST_CODE
): JokerFlyerNoPromotionRow[] {
  const flyerUrl = asString(payload.url);
  if (!flyerUrl) return [];

  return [
    {
      chain: 'joker',
      country: 'NO',
      currency: 'NOK',
      source: 'joker.no/kundeavis',
      promotionType: 'weekly_flyer',
      postCode,
      flyerUrl,
      validFrom: asString(payload.validFrom),
      validTo: asString(payload.validTo)
    }
  ];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}
