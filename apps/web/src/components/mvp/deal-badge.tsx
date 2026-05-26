import type { DealLabel } from '@/lib/mvp/types';
import { formatDealLabel } from '@/lib/mvp/format';

const tone: Record<DealLabel, string> = {
  real_deal: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  fair_discount: 'border-sky-200 bg-sky-50 text-sky-900',
  not_really_a_deal: 'border-rose-200 bg-rose-50 text-rose-900',
  unknown: 'border-slate-200 bg-slate-50 text-slate-700'
};

export function DealBadge({ label }: Readonly<{ label: DealLabel }>) {
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${tone[label]}`}>
      {formatDealLabel(label)}
    </span>
  );
}
