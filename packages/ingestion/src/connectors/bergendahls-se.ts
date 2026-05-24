export const BERGENDAHLS_SE_INVESTIGATION_NOTE =
  'Not feasible: Bergendahls price notices are handled in a login-gated supplier portal, and no public SE price feed endpoint was found.';

export type BergendahlsSeProductRow = {
  country: 'SE';
  currency: 'SEK';
  chain: 'bergendahls';
  sourceUrl: string;
  retrievedAt: string;
};

export async function fetchBergendahlsSeProducts(): Promise<BergendahlsSeProductRow[]> {
  throw new Error(BERGENDAHLS_SE_INVESTIGATION_NOTE);
}
