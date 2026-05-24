type ConfidenceBadgeProps = {
  level: "high" | "medium" | "low";
  label: string;
  sampleSize?: number;
  emptyData?: boolean;
  onAction?: () => void;
  actionLabel?: string;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({
  level,
  label,
  sampleSize,
  emptyData = false,
  onAction,
  actionLabel = label,
}: ConfidenceBadgeProps) {
  const className = `inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`;
  const sampleText = emptyData ? "No data" : sampleSize !== undefined ? `n=${sampleSize}` : null;
  const content = (
    <>
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {label}
      {sampleText ? <span className="normal-case tracking-normal">{sampleText}</span> : null}
    </>
  );

  if (onAction) {
    return (
      <button aria-label={actionLabel} className={className} disabled={emptyData} onClick={onAction} type="button">
        {content}
      </button>
    );
  }

  return <span className={className}>{content}</span>;
}
