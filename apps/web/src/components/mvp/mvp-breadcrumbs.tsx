import Link from 'next/link';

export type MvpBreadcrumbItem = {
  label: string;
  href?: string;
};

export function MvpBreadcrumbs({ items }: Readonly<{ items: MvpBreadcrumbItem[] }>) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm font-semibold text-slate-600">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li className="flex items-center gap-2" key={`${item.label}-${index}`}>
            {index > 0 ? <span aria-hidden="true" className="text-slate-400">›</span> : null}
            {item.href ? (
              <Link className="text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={item.href}>
                {item.label}
              </Link>
            ) : (
              <span className="font-black text-slate-950">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
