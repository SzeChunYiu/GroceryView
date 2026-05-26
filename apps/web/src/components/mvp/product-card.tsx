import Image from 'next/image';
import Link from 'next/link';
import type { ProductSummary } from '@/lib/mvp/types';
import { formatSek } from '@/lib/mvp/format';
import { productRoute } from '@/lib/mvp/routes';
import { DealBadge } from './deal-badge';
import { EvidenceStrip } from './evidence-strip';

export function MvpProductCard({ product }: Readonly<{ product: ProductSummary }>) {
  const href = productRoute(product.id);
  return (
    <Link className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200" href={href}>
      <div className="flex gap-3">
        {product.imageUrl ? (
          <Image alt="" className="h-16 w-16 rounded-xl object-cover" height={64} src={product.imageUrl} width={64} />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">No image</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {product.dealLabel ? <DealBadge label={product.dealLabel} /> : null}
            <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">{product.categoryName}</span>
          </div>
          <h3 className="mt-1 line-clamp-2 text-lg font-black text-slate-950">{product.name}</h3>
          {product.brand ? <p className="text-sm font-semibold text-slate-600">{product.brand}</p> : null}
          {product.currentBestPrice !== undefined ? (
            <p className="mt-2 text-xl font-black text-emerald-800">{formatSek(product.currentBestPrice)}</p>
          ) : (
            <p className="mt-2 text-sm font-semibold text-amber-800">Price unavailable in verified snapshot</p>
          )}
          <div className="mt-2">
            <EvidenceStrip evidence={product} />
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-500">{product.categoryName}</p>
        </div>
      </div>
    </Link>
  );
}
