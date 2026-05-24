type EcoBadgeProps = {
  score: number;
  band: 'low' | 'medium' | 'high' | 'unknown';
  evidence: string;
};

const bandLabel = {
  low: 'Lower footprint',
  medium: 'Moderate footprint',
  high: 'Higher footprint',
  unknown: 'Eco score unknown'
} as const;

export function EcoBadge({ score, band, evidence }: EcoBadgeProps) {
  const tone = band === 'low' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : band === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-950' : 'border-rose-200 bg-rose-50 text-rose-900';

  return (
    <div className={`rounded-2xl border px-3 py-2 ${tone}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em]">Eco</p>
      <p className="mt-1 text-sm font-black">{bandLabel[band]} · {Math.round(score)}/100</p>
      <p className="mt-1 text-xs leading-5">{evidence}</p>
    </div>
  );
}
