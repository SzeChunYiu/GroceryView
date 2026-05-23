import Link from 'next/link';

export type Breadcrumb = {
  href?: string;
  label: string;
};

type BreadcrumbsProps = {
  items: readonly Breadcrumb[];
};

function isLast(index: number, items: readonly Breadcrumb[]) {
  return index === items.length - 1;
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-market-ink/60">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center gap-1">
            {item.href && !isLast(index, items) ? (
              <Link href={item.href} className="font-semibold text-market-mint hover:text-market-mint/75">
                {item.label}
              </Link>
            ) : (
              <span className="font-bold text-market-ink" aria-current={isLast(index, items) ? 'page' : undefined}>
                {item.label}
              </span>
            )}
            {!isLast(index, items) ? <span className="text-market-ink/45">›</span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
