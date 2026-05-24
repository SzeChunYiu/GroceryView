import { confidenceCopy, type ConfidenceLevel } from '@/lib/content-style';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label?: string;
  sampleSize?: number;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ level, label, sampleSize }: ConfidenceBadgeProps) {
  const displayLabel = label ?? confidenceCopy(level, sampleSize);
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {displayLabel}
      {sampleSize !== undefined && label ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
    </span>
  );
}
