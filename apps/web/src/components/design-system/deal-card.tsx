import Link from 'next/link';
import type { DealEvaluation } from '@/lib/mvp/types';
import { formatDealLabel, formatPercent, formatSek } from '@/lib/mvp/format';
import { productRoute } from '@/lib/mvp/routes';
import { DealBadge } from '@/components/mvp/deal-badge';
import { EvidenceStrip } from './evidence-strip';
import { dsCard, dsPrimaryButton } from './shared';
import { cn } from '@/lib/utils';

const dealTone: Record<DealEvaluation['dealLabel'], string> = {
  real_deal: 'border-[color:var(--gv-success)]/30 bg-[var(--gv-primary-soft)]',
  fair_discount: 'border-[color:var(--gv-info)]/25 bg-[var(--gv-surface-muted)]',
  not_really_a_deal: 'border-[color:var(--gv-danger)]/25 bg-[var(--gv-surface-muted)]',
  unknown: 'border-[color:var(--gv-border)] bg-[var(--gv-surface)]'
};

export function DealCard({ deal, className }: Readonly<{ deal: DealEvaluation; className?: string }>) {
  const href = productRoute(deal.product.id);

  return (
    <article className={cn(dsCard, dealTone[deal.dealLabel], 'p-5', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <DealBadge label={deal.dealLabel} />
        <span className="text-[length:var(--gv-text-micro)] font-bold uppercase tracking-[0.14em] text-[color:var(--gv-muted)]">
          {formatDealLabel(deal.dealLabel)}
        </span>
      </div>
      <h3 className="mt-3 text-xl font-extrabold text-[color:var(--gv-ink)]">{deal.product.name}</h3>
      <p className="mt-2 text-2xl font-extrabold text-[color:var(--gv-primary)]">{formatSek(deal.currentPrice)}</p>
      <dl className="mt-4 grid gap-2 text-[length:var(--gv-text-small)] text-[color:var(--gv-ink-soft)]">
        {deal.historicMedianPrice !== undefined ? (
          <div className="flex justify-between gap-4">
            <dt>Historic median</dt>
            <dd className="font-bold text-[color:var(--gv-ink)]">{formatSek(deal.historicMedianPrice)}</dd>
          </div>
        ) : null}
        {deal.historicDiscountPct !== undefined ? (
          <div className="flex justify-between gap-4">
            <dt>Vs historic</dt>
            <dd className="font-bold text-[color:var(--gv-success)]">{formatPercent(deal.historicDiscountPct)}</dd>
          </div>
        ) : null}
        {deal.nearbyDiscountPct !== undefined ? (
          <div className="flex justify-between gap-4">
            <dt>Vs nearby</dt>
            <dd className="font-bold text-[color:var(--gv-ink)]">{formatPercent(deal.nearbyDiscountPct)}</dd>
          </div>
        ) : null}
      </dl>
      {deal.reasons.length > 0 ? (
        <ul className="mt-4 list-disc space-y-1 pl-5 text-[length:var(--gv-text-small)] leading-6 text-[color:var(--gv-ink-soft)]">
          {deal.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-4 rounded-[length:var(--gv-radius-control)] border border-[color:var(--gv-border)] bg-[var(--gv-surface)]/80 px-3 py-2">
        <EvidenceStrip evidence={deal} />
      </div>
      <div className="mt-4">
        <Link className={dsPrimaryButton} href={href}>
          Open product
        </Link>
      </div>
    </article>
  );
}
