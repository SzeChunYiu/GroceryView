export type CategoryCount = {
  slug: string;
  count: number;
};

export function getCategoryCounts(products: ReadonlyArray<{ category?: string | null }>): CategoryCount[] {
  const counts = new Map<string, number>();

  for (const product of products) {
    const slug = (product.category && product.category.trim()) || 'pantry';
    counts.set(slug, (counts.get(slug) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.slug.localeCompare(b.slug);
    });
}
