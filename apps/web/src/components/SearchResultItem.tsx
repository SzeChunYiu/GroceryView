import Link from 'next/link';
import type { ProductSearchResult } from '@/hooks/useSearch';

type SearchResultItemProps = {
  id: string;
  isActive: boolean;
  result: ProductSearchResult;
};

export function SearchResultItem({ id, isActive, result }: Readonly<SearchResultItemProps>) {
  return (
    <Link
      aria-selected={isActive}
      className={`block px-4 py-3 transition focus:bg-emerald-50 focus:outline-none ${
        isActive ? 'bg-emerald-50' : 'hover:bg-emerald-50'
      }`}
      href={`/products/${result.slug}`}
      id={id}
      role="option"
    >
      <span className="block text-sm font-black text-slate-950">{result.name}</span>
      <span className="mt-1 block text-xs font-semibold text-slate-600">{result.brand ?? 'Brand not reported'} · PostgreSQL product search</span>
    </Link>
  );
}
