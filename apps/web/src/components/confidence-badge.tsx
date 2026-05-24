import { confidenceLevelForCountry, confidenceTooltip, type ConfidenceLevel } from '@groceryview/core';

type ConfidenceBadgeProps = {
  level: Exclude<ConfidenceLevel, 'unknown'>;
  label: string;
  sampleSize?: number;
  countryCode?: string;
  coveragePercent?: number;
};

const levelClasses: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
  unknown: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ConfidenceBadge({ level, label, sampleSize, countryCode, coveragePercent }: ConfidenceBadgeProps) {
  const resolvedLevel = confidenceLevelForCountry({ countryCode, coveragePercent, level, sampleSize });
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[resolvedLevel]}`}
      title={confidenceTooltip({ countryCode, coveragePercent, label, level, sampleSize })}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
      {sampleSize !== undefined ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
    </span>
  );
}
