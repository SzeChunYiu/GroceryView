type ConfidenceBadgeProps = {
  level: "high" | "medium" | "low";
  label: string;
  sampleSize?: number;
  actionLabel?: string;
  emptyData?: boolean;
  onAction?: () => void;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ actionLabel = "Review", emptyData = false, level, label, onAction, sampleSize }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
      {sampleSize !== undefined ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
      {onAction ? (
        <button
          className="rounded border border-current px-2 py-0.5 normal-case tracking-normal disabled:cursor-not-allowed disabled:opacity-50"
          disabled={emptyData}
          onClick={emptyData ? undefined : onAction}
          type="button"
        >
          {actionLabel}
        </button>
      ) : null}
    </span>
  );
}
