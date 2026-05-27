type EcoBadgeScore = Readonly<{
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'E';
  label: string;
  source: string;
  reasons: readonly string[];
}>;

const gradeStyles: Record<EcoBadgeScore['grade'], string> = {
  A: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  B: 'border-lime-200 bg-lime-50 text-lime-900',
  C: 'border-amber-200 bg-amber-50 text-amber-900',
  D: 'border-orange-200 bg-orange-50 text-orange-900',
  E: 'border-rose-200 bg-rose-50 text-rose-900'
};

export function EcoBadge({ score }: Readonly<{ score: EcoBadgeScore }>) {
  return (
    <span
      aria-label={`Carbon footprint grade ${score.grade}, ${score.score} of 100. ${score.label}. ${score.reasons.join(', ')}`}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.12em] ${gradeStyles[score.grade]}`}
      title={`${score.source}: ${score.reasons.join(', ')}`}
    >
      <span>CO₂ {score.grade}</span>
      <span>{score.score}/100</span>
    </span>
  );
}
