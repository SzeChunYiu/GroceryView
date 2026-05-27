import Link from 'next/link';
import { categoryPathForSlug } from '@groceryview/db';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: Readonly<{ items: readonly BreadcrumbItem[] }>) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mt-4 text-sm font-bold text-slate-600">
      <ol className="flex flex-wrap items-center gap-2" role="list">
        {items.map((item, index) => {
          const current = index === items.length - 1;
          return (
            <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
              {index > 0 ? <span aria-hidden="true" className="text-slate-400">›</span> : null}
              {item.href && !current ? (
                <Link className="text-emerald-800 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={current ? 'page' : undefined} className={current ? 'text-slate-950' : undefined}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function CategoryBreadcrumb({ slug, categoryLabel }: Readonly<{ slug: string; categoryLabel: string }>) {
  const hierarchy = categoryPathForSlug(slug);
  const items: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    ...hierarchy.map((node, index) => ({
      label: index === hierarchy.length - 1 ? categoryLabel : node.label,
      href: node.routable && node.slug !== slug ? `/categories/${node.slug}` : undefined
    }))
  ];

  return <Breadcrumbs items={items} />;
}

export function ProductBreadcrumb({
  categoryLabel,
  categorySlug,
  productHref,
  productLabel
}: Readonly<{
  categoryLabel: string;
  categorySlug: string;
  productHref: string;
  productLabel: string;
}>) {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: categoryLabel, href: `/categories/${categorySlug}` },
        { label: productLabel, href: productHref }
      ]}
    />
  );
}
