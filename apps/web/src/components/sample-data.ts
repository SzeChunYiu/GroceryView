export type BasketItem = {
  name: string;
  currentPrice: number;
};

export type HouseholdMember = {
  name: string;
  role: string;
  budgetShare: number;
  dietaryTags: string;
};

export type PrivacyControl = {
  label: string;
  detail: string;
  state: string;
};

export const basketItems: BasketItem[] = [
  { name: 'Zoegas Coffee', currentPrice: 49.9 },
  { name: 'Arla Milk', currentPrice: 13.9 },
  { name: 'Butter 600g', currentPrice: 54.9 },
  { name: 'Eggs 12-pack', currentPrice: 34.9 }
];

export const householdMembers: HouseholdMember[] = [
  { name: 'Alex', role: 'Owner', budgetShare: 45, dietaryTags: 'Nut alerts, receipt review' },
  { name: 'Mira', role: 'Shopper', budgetShare: 35, dietaryTags: 'Pork-free substitutions' },
  { name: 'Sam', role: 'Reviewer', budgetShare: 20, dietaryTags: 'Low-confidence price review' }
];

export const privacyControls: PrivacyControl[] = [
  {
    label: 'Raw receipt media',
    detail: 'Stored separately from normalized price observations and deleted after review.',
    state: 'Limited'
  },
  {
    label: 'Location precision',
    detail: 'Store and district metadata are retained without route history.',
    state: 'Reduced'
  },
  {
    label: 'Catalog contributions',
    detail: 'Shared price facts keep provenance and remove household identifiers.',
    state: 'Anonymized'
  },
  {
    label: 'Advertiser payloads',
    detail: 'No raw receipt lines, household identity, or private notes are exposed.',
    state: 'Aggregated'
  }
];

export function formatSek(value: number) {
  return `${value.toFixed(2)} kr`;
}
