export const BERGENDAHLS_SE_INVESTIGATION_NOTE =
  'Not feasible: Bergendahls Food wholesale was acquired into Axfood/Dagab, and no public Bergendahls grocery price feed was found on the checked primary sources.';

export type BergendahlsSeConnectorStatus = {
  country: 'SE';
  currency: 'SEK';
  chain: 'bergendahls';
  status: 'not_feasible_no_public_price_feed';
  rows: [];
  investigatedAt: string;
  evidenceUrls: string[];
  note: typeof BERGENDAHLS_SE_INVESTIGATION_NOTE;
};

export function getBergendahlsSeConnectorStatus(investigatedAt = new Date().toISOString()): BergendahlsSeConnectorStatus {
  return {
    country: 'SE',
    currency: 'SEK',
    chain: 'bergendahls',
    status: 'not_feasible_no_public_price_feed',
    rows: [],
    investigatedAt,
    evidenceUrls: [
      'https://www.axfood.com/newsroom/press-releases/2021/09/axfoods-acquisition-of-bergendahls-food-and-partnership-with-city-gross-approved-by-the-swedish-competition-authority/',
      'https://bergendahls.se/wp-content/uploads/2024/11/BSAB-241118-v1-LOW.pdf'
    ],
    note: BERGENDAHLS_SE_INVESTIGATION_NOTE
  };
}
