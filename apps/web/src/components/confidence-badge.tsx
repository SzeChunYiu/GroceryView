import { confidenceCopy, type ConfidenceLevel } from '@/lib/content-style';
import { confidenceStateToken } from '@/lib/color-vision-palette';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel | "unknown";
  label?: string;
  sampleSize?: number;
  countryCode?: string;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
  unknown: "border-slate-200 bg-slate-50 text-slate-600",
};

export function ConfidenceBadge({ level, label, sampleSize, countryCode = "SE" }: ConfidenceBadgeProps) {
  const displayLabel = label ?? (level === "unknown" ? "unknown source confidence" : confidenceCopy(level, sampleSize));
  const token = level === "unknown"
    ? { indicator: "?", meaning: "Unknown source confidence" }
    : confidenceStateToken(level);
  return (
    <span
      aria-label={`${displayLabel}. ${token.meaning}. Indicator ${token.indicator}.`}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
      title={`${countryCode.toUpperCase()} coverage confidence: ${displayLabel}${sampleSize !== undefined ? `, n=${sampleSize}` : ""}`}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 font-black leading-none" aria-hidden="true">
        {token.indicator}
      </span>
      {displayLabel}
      {sampleSize !== undefined && label ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
    </span>
  );
}
