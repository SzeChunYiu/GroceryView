import Link from 'next/link';

type CategoryNavItem = {
  slug: string;
  label: string;
  count: number;
};

export function CategoryNav({
  categories,
  activeCategory
}: Readonly<{
  categories: CategoryNavItem[];
  activeCategory?: string;
}>) {
  return (
    <aside className="rounded-lg border border-market-ink/10 bg-white p-3 sm:p-4">
      <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-market-mint">Categories</h2>
      <nav className="space-y-1">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className={`flex items-center justify-between rounded-md px-2 py-2 text-sm font-semibold transition ${
              activeCategory === category.slug
                ? 'bg-market-mint/20 text-market-ink'
                : 'text-market-ink/70 hover:bg-market-mint/10 hover:text-market-ink'
            }`}
          >
            <span className="truncate">{category.label}</span>
            <span className="rounded-full bg-market-oat px-2 py-0.5 text-xs font-black">{category.count}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
