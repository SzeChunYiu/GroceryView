export type SeedBrand = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

export function brandSlug(name: string) {
  return name
    .trim()
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildSeedBrands(
  brandNames: Array<string | null | undefined>,
  logoUrls: Record<string, string | undefined> = {}
): SeedBrand[] {
  const brandsBySlug = new Map<string, SeedBrand>();

  for (const brandName of brandNames) {
    const name = brandName?.trim();
    if (!name) continue;

    const slug = brandSlug(name);
    if (!slug || brandsBySlug.has(slug)) continue;

    brandsBySlug.set(slug, {
      name,
      slug,
      logoUrl: logoUrls[slug] ?? null
    });
  }

  return [...brandsBySlug.values()].sort((left, right) =>
    left.name.localeCompare(right.name, 'sv')
  );
}

export const seedBrands: SeedBrand[] = [];
