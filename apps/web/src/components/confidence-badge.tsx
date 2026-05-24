/**
 * Displays a compact badge that communicates a confidence level with a label and optional sample size.
 *
 * @example
 * <ConfidenceBadge level="high" label="High confidence" sampleSize={42} />
 *
 * @param level Visual confidence level that selects the badge color treatment.
 * @param label Text displayed inside the badge.
 * @param sampleSize Optional sample count displayed as `n={sampleSize}` when provided.
 */
type ConfidenceBadgeProps = {
  level: "high" | "medium" | "low";
  label: string;
  sampleSize?: number;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ level, label, sampleSize }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
      {sampleSize !== undefined ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
    </span>
  );
}
