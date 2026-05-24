export type ActionSePresenceStatus = {
  chain: 'action';
  country: 'SE';
  hasVerifiedPresence: false;
  sourceUrl: string;
  reason: string;
};

export type ActionSeProduct = {
  chain: 'action';
  country: 'SE';
  currency: 'SEK';
  code: string;
  name: string;
  price: number;
  sourceUrl: string;
  retrievedAt: string;
};

export const ACTION_SE_PRESENCE: ActionSePresenceStatus = {
  chain: 'action',
  country: 'SE',
  hasVerifiedPresence: false,
  sourceUrl: 'https://www.action.com/',
  reason: 'Action.com country/store pages do not list Sweden as an active Action market; connector remains closed until SE presence is verified.'
};

export async function fetchActionSeProducts(): Promise<ActionSeProduct[]> {
  return [];
}
