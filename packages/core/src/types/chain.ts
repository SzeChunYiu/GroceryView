export const retailerTypes = [
  'grocery',
  'pharmacy',
  'fuel',
  'convenience',
  'variety',
  'cosmetics',
  'household',
  'online_marketplace',
  'ethnic_asian',
  'ethnic_polish_eastern_european',
  'ethnic_middle_eastern',
  'ethnic_indian_south_asian',
  'ethnic_latin',
  'ethnic_african',
  'health_food',
  'kosher_halal'
] as const;

export type RetailerType = typeof retailerTypes[number];

export const retailerTypeLabels = {
  grocery: 'Grocery',
  pharmacy: 'Pharmacy',
  fuel: 'Fuel',
  convenience: 'Convenience',
  variety: 'Variety',
  cosmetics: 'Cosmetics',
  household: 'Household',
  online_marketplace: 'Online marketplace',
  ethnic_asian: 'Asian grocery',
  ethnic_polish_eastern_european: 'Polish and Eastern European grocery',
  ethnic_middle_eastern: 'Middle Eastern grocery',
  ethnic_indian_south_asian: 'Indian and South Asian grocery',
  ethnic_latin: 'Latin American grocery',
  ethnic_african: 'African grocery',
  health_food: 'Health food',
  kosher_halal: 'Kosher and halal grocery'
} as const satisfies Record<RetailerType, string>;

export const retailerTypeDescriptions = {
  grocery: 'Full-range grocery chains and supermarkets.',
  pharmacy: 'Pharmacies carrying regulated pharmacy goods and adjacent health products.',
  fuel: 'Fuel stations where the primary retail lane is fuel.',
  convenience: 'Convenience stores and kiosks with a limited everyday assortment.',
  variety: 'General variety retailers with broad non-food and selected grocery overlap.',
  cosmetics: 'Cosmetics and beauty retailers with personal-care overlap.',
  household: 'Household, DIY, auto, and home-goods retailers with grocery-adjacent consumables.',
  online_marketplace: 'Online-first marketplaces that aggregate seller or surplus inventory.',
  ethnic_asian: 'Pan-Asian or East/Southeast Asian grocery specialists.',
  ethnic_polish_eastern_european: 'Polish, Baltic, Balkan, Slavic, or broader Eastern European grocery specialists.',
  ethnic_middle_eastern: 'Middle Eastern, Turkish, Persian, Levantine, or Arab grocery specialists.',
  ethnic_indian_south_asian: 'Indian, Pakistani, Bangladeshi, Sri Lankan, Nepali, or broader South Asian grocery specialists.',
  ethnic_latin: 'Latin American, Central American, South American, or Caribbean grocery specialists.',
  ethnic_african: 'African or Afro-Caribbean grocery specialists.',
  health_food: 'Health-food, supplements, natural food, and wellness grocery specialists.',
  kosher_halal: 'Kosher, halal, or religious dietary-specialist grocery retailers.'
} as const satisfies Record<RetailerType, string>;

export const specialtyRetailerTypes = [
  'ethnic_asian',
  'ethnic_polish_eastern_european',
  'ethnic_middle_eastern',
  'ethnic_indian_south_asian',
  'ethnic_latin',
  'ethnic_african',
  'health_food',
  'kosher_halal'
] as const satisfies readonly RetailerType[];

export type SpecialtyRetailerType = typeof specialtyRetailerTypes[number];

export function isRetailerType(value: string): value is RetailerType {
  return (retailerTypes as readonly string[]).includes(value);
}

export function isSpecialtyRetailerType(value: string): value is SpecialtyRetailerType {
  return (specialtyRetailerTypes as readonly string[]).includes(value);
}
