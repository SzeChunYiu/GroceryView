/**
 * ConfidenceBadge renders the compact trust indicator used beside product, store,
 * and chain evidence summaries when the UI needs to explain how dependable a
 * comparison is. Consumers provide a semantic confidence level, a short label,
 * and optionally the sample size behind the score.
 *
 * Accessibility: the badge is plain text inside a non-interactive inline element.
 * The colored status dot is marked aria-hidden so screen readers announce the
 * label and optional sample size without redundant color-only information.
 *
 * Dependencies: styling is limited to Tailwind utility classes from the web app
 * design system; no runtime providers, icons, or data-fetching hooks are needed.
 *
 * Edge cases: omit sampleSize when the backing evidence count is unknown. The
 * component still renders the supplied confidence label, and the explicit level
 * mapping keeps unsupported visual states from appearing silently.
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
