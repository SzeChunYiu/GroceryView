export type BrandAlias = {
  canonical: string;
  aliases: string[];
};

export function normalizeAliasValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const BRAND_ALIAS_SEEDS: BrandAlias[] = [
  {
    canonical: 'Arla',
    aliases: ['Arla Foods']
  },
  {
    canonical: 'ICA',
    aliases: ['ICA Nära', 'ICA Nara', 'ICA Basic']
  }
];

const canonicalizedAliases = BRAND_ALIAS_SEEDS.flatMap(({ canonical, aliases }) => [
  [normalizeAliasValue(canonical), canonical],
  ...aliases.map((alias) => [normalizeAliasValue(alias), canonical] as const)
]);

export const BRAND_ALIAS_MAP = new Map<string, string>(canonicalizedAliases);

export function canonicalizeBrand(rawBrand: string | undefined): string | undefined {
  if (!rawBrand?.trim()) return undefined;
  const normalized = normalizeAliasValue(rawBrand);
  return BRAND_ALIAS_MAP.get(normalized) ?? rawBrand.trim();
}
