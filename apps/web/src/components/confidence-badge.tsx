type ConfidenceBadgeProps = {
  confidence?: {
    level: "high" | "medium" | "low";
    label: string;
    sampleSize?: number;
  };
  level?: "high" | "medium" | "low";
  label?: string;
  sampleSize?: number;
};

const levelClasses = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ confidence, level, label, sampleSize }: ConfidenceBadgeProps) {
  const badgeLevel = confidence?.level ?? level;
  const badgeLabel = confidence?.label ?? label ?? "unknown";
  const badgeSampleSize = confidence?.sampleSize ?? sampleSize;

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
        badgeLevel ? levelClasses[badgeLevel] : "border-slate-200 bg-slate-50 text-slate-700"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-current" aria-hidden="true" />
      {badgeLabel}
      {badgeSampleSize !== undefined ? <span className="normal-case tracking-normal">n={badgeSampleSize}</span> : null}
    </span>
  );
}
