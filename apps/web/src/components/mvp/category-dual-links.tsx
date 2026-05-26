import Link from 'next/link';
import { categoryBrowseHref, categoryMarketHref, categorySearchHref } from '@/lib/mvp/routes';

export function CategoryDualLinks({
  categorySlug,
  categoryName
}: Readonly<{ categorySlug: string; categoryName: string }>) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link className="rounded-full bg-emerald-800 px-3 py-1 text-xs font-black text-white" href={categoryMarketHref(categorySlug)}>
        Market: {categoryName}
      </Link>
      <Link className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-800 ring-1 ring-slate-200" href={categoryBrowseHref(categorySlug)}>
        Browse: {categoryName}
      </Link>
      <Link className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-800" href={categorySearchHref(categorySlug)}>
        Search in category
      </Link>
    </div>
  );
}
