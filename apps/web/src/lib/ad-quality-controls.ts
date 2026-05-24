export type AdPlacement = {
  id: string;
  label: string;
  reservedHeight: number;
  consentMode: 'non-personalized-until-consent';
  mustNotObscure: string[];
};

export const allowedAdPlacements: AdPlacement[] = [
  {
    id: 'home-below-market-shell',
    label: 'Homepage below market shell',
    reservedHeight: 96,
    consentMode: 'non-personalized-until-consent',
    mustNotObscure: ['prices', 'confidence badges', 'critical shopping actions']
  }
];

export const adQualityChecks = [
  {
    id: 'reserved-space-cls',
    label: 'Reserved space prevents CLS',
    evidence: 'Every allowed placement declares a fixed reservedHeight before ad content loads.'
  },
  {
    id: 'consent-safe-fallback',
    label: 'Consent-safe fallback',
    evidence: 'Slots serve non-personalized messaging until a consented ad mode is available.'
  },
  {
    id: 'no-dark-pattern-overlap',
    label: 'No dark pattern overlap',
    evidence: 'Allowed placements must not obscure prices, confidence badges, or critical shopping actions.'
  }
];

export function adPlacementFor(id: string) {
  return allowedAdPlacements.find((placement) => placement.id === id) ?? allowedAdPlacements[0];
}
