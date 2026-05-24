export type CategorySeed = {
  name: string;
  slug: string;
  parentSlug: string | null;
  level: 1 | 2 | 3;
};

export const categoryTaxonomy: CategorySeed[] = [
  { name: 'Food', slug: 'food', parentSlug: null, level: 1 },
  { name: 'Dairy', slug: 'dairy', parentSlug: 'food', level: 2 },
  { name: 'Cheese', slug: 'cheese', parentSlug: 'dairy', level: 3 },
  { name: 'Milk', slug: 'milk', parentSlug: 'dairy', level: 3 },
  { name: 'Bakery', slug: 'bakery', parentSlug: 'food', level: 2 },
  { name: 'Bread', slug: 'bread', parentSlug: 'bakery', level: 3 },
  { name: 'Produce', slug: 'produce', parentSlug: 'food', level: 2 },
  { name: 'Fruit', slug: 'fruit', parentSlug: 'produce', level: 3 },
  { name: 'Vegetables', slug: 'vegetables', parentSlug: 'produce', level: 3 },
];

export const seedCategoriesSql = `
  insert into categories (name, slug, parent_slug, level)
  values ($1, $2, $3, $4)
  on conflict (slug) do update set
    name = excluded.name,
    parent_slug = excluded.parent_slug,
    level = excluded.level
`;

export async function seedCategories(query: (sql: string, params: unknown[]) => Promise<unknown>) {
  for (const category of categoryTaxonomy) {
    await query(seedCategoriesSql, [category.name, category.slug, category.parentSlug, category.level]);
  }
  return { insertedOrUpdated: categoryTaxonomy.length };
}
