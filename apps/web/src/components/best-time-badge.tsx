type BestTimeBadgeProps = {
  label: 'Likely on sale next week' | 'Wait for a later promo' | 'Buy when needed';
  confidence: number;
  evidence: string;
  nextDiscountWindowStart?: string | null;
};

export function BestTimeBadge({ label, confidence, evidence, nextDiscountWindowStart }: BestTimeBadgeProps) {
  const tone = label === 'Likely on sale next week' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : label === 'Wait for a later promo' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-slate-200 bg-slate-50 text-slate-700';

  return (
    <aside className={`rounded-3xl border p-4 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.2em]">Best time to buy</p>
      <p className="mt-2 text-lg font-black">{label}</p>
      {nextDiscountWindowStart ? <p className="mt-1 text-sm font-bold">Next probable window starts {nextDiscountWindowStart}</p> : null}
      <p className="mt-2 text-sm leading-6">{evidence}</p>
      <p className="mt-2 text-xs font-bold">Confidence {Math.round(confidence * 100)}%</p>
    </aside>
  );
}
