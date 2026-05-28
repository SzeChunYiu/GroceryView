import Image from 'next/image';
import Link from 'next/link';
import type { ProductSummary } from '@/lib/mvp/types';
import { formatPercent, formatSek } from '@/lib/mvp/format';
import { productRoute } from '@/lib/mvp/routes';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from './evidence-strip';
import { dsCard, dsPrimaryButton } from './shared';
import { cn } from '@/lib/utils';

export function ProductCard({
  product,
  packageLabel,
  unitPriceLabel,
  className
}: Readonly<{
  product: ProductSummary;
  packageLabel?: string;
  unitPriceLabel?: string;
  className?: string;
}>) {
  const href = productRoute(product.id);

  return (
    <article className={cn(dsCard, 'overflow-hidden transition hover:-translate-y-0.5 hover:shadow-[var(--gv-shadow)]', className)}>
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        {product.imageUrl ? (
          <Image alt="" className="h-20 w-20 shrink-0 rounded-[length:var(--gv-radius-control)] object-cover" height={80} src={product.imageUrl} width={80} />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[length:var(--gv-radius-control)] bg-[var(--gv-surface-muted)] text-[length:var(--gv-text-micro)] font-bold text-[color:var(--gv-muted)]">
            No image
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-[color:var(--gv-border)] bg-[var(--gv-surface-muted)] px-2 py-0.5 text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.12em] text-[color:var(--gv-ink-soft)]">
              {product.categoryName}
            </span>
            {product.dealLabel ? <DealBadge label={product.dealLabel} /> : null}
          </div>
          <h3 className="mt-2 line-clamp-2 text-lg font-extrabold text-[color:var(--gv-ink)]">{product.name}</h3>
          {product.brand ? <p className="text-[length:var(--gv-text-small)] font-semibold text-[color:var(--gv-ink-soft)]">{product.brand}</p> : null}
          {packageLabel ? <p className="mt-1 text-[length:var(--gv-text-small)] text-[color:var(--gv-muted)]">{packageLabel}</p> : null}
          {product.currentBestPrice !== undefined ? (
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <p className="text-xl font-extrabold text-[color:var(--gv-primary)]">{formatSek(product.currentBestPrice)}</p>
              {unitPriceLabel ? <p className="text-[length:var(--gv-text-small)] font-semibold text-[color:var(--gv-muted)]">{unitPriceLabel}</p> : null}
            </div>
          ) : (
            <p className="mt-2 text-[length:var(--gv-text-small)] font-semibold text-[color:var(--gv-warning)]">Price unavailable in verified snapshot</p>
          )}
          {product.priceChangeWeeklyPct !== undefined ? (
            <p className="mt-1 text-[length:var(--gv-text-micro)] font-semibold text-[color:var(--gv-ink-soft)]">Weekly change {formatPercent(product.priceChangeWeeklyPct)}</p>
          ) : null}
          {product.currentBestChain ? (
            <p className="mt-1 text-[length:var(--gv-text-micro)] font-semibold text-[color:var(--gv-ink-soft)]">{product.currentBestChain}</p>
          ) : null}
          <div className="mt-3 rounded-[length:var(--gv-radius-control)] bg-[var(--gv-primary-soft)]/40 px-3 py-2">
            <EvidenceStrip evidence={product} />
          </div>
          <div className="mt-4">
            <Link className={dsPrimaryButton} href={href}>
              Open product
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
