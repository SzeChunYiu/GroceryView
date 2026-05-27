export type BrandSeedRow = {
  name: string;
  slug: string;
  logoUrl: string | null;
};

type BrandUpsertClient = {
  brand: {
    upsert(args: {
      where: { slug: string };
      create: BrandSeedRow;
      update: { name: string; logoUrl: string | null };
    }): Promise<unknown>;
  };
};

export const groceryBrandSeeds: BrandSeedRow[] = [
  { name: 'Arla', slug: 'arla', logoUrl: null },
  { name: 'Garant', slug: 'garant', logoUrl: null },
  { name: 'ICA', slug: 'ica', logoUrl: null },
  { name: 'Coop', slug: 'coop', logoUrl: null },
  { name: 'Eldorado', slug: 'eldorado', logoUrl: null },
  { name: 'Zeta', slug: 'zeta', logoUrl: null },
  { name: 'Zoegas', slug: 'zoegas', logoUrl: null },
  { name: 'Scan', slug: 'scan', logoUrl: null }
];

export function normalizeBrandSlug(name: string): string {
  return name
    .toLocaleLowerCase('sv-SE')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function seedGroceryBrands(prisma: BrandUpsertClient, rows: readonly BrandSeedRow[] = groceryBrandSeeds): Promise<number> {
  for (const row of rows) {
    const slug = row.slug || normalizeBrandSlug(row.name);
    await prisma.brand.upsert({
      where: { slug },
      create: { name: row.name, slug, logoUrl: row.logoUrl },
      update: { name: row.name, logoUrl: row.logoUrl }
    });
  }
  return rows.length;
}
