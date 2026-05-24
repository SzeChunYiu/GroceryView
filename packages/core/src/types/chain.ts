export const retailerTypes = [
  'supermarket',
  'discount',
  'hypermarket',
  'convenience',
  'pharmacy',
  'fuel_convenience',
  'online',
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

export const retailerTypeLabels: Record<RetailerType, string> = {
  supermarket: 'Supermarket',
  discount: 'Discount grocery',
  hypermarket: 'Hypermarket',
  convenience: 'Convenience',
  pharmacy: 'Pharmacy',
  fuel_convenience: 'Fuel convenience',
  online: 'Online grocery',
  ethnic_asian: 'Asian specialty grocery',
  ethnic_polish_eastern_european: 'Polish / Eastern European specialty grocery',
  ethnic_middle_eastern: 'Middle Eastern specialty grocery',
  ethnic_indian_south_asian: 'Indian / South Asian specialty grocery',
  ethnic_latin: 'Latin specialty grocery',
  ethnic_african: 'African specialty grocery',
  health_food: 'Health food grocery',
  kosher_halal: 'Kosher / halal grocery'
};

export function isSpecialtyRetailerType(retailerType: RetailerType): boolean {
  return (specialtyRetailerTypes as readonly RetailerType[]).includes(retailerType);
}
