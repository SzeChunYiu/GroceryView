type ConfidenceLevel = "high" | "medium" | "low";

const confidenceStyles: Record<ConfidenceLevel, string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/70 dark:bg-emerald-950/50 dark:text-emerald-300",
  medium:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-300",
  low: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/70 dark:bg-rose-950/50 dark:text-rose-300",
};

export type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label?: string;
  sampleSize?: number;
};

export function ConfidenceBadge({
  level,
  label = `${level} confidence`,
  sampleSize,
}: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${confidenceStyles[level]}`}
      aria-label={label}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
      {typeof sampleSize === "number" ? (
        <span className="normal-case tracking-normal opacity-75">n={sampleSize}</span>
      ) : null}
    </span>
  );
}
