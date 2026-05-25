import { confidenceCopy, type ConfidenceLevel } from '@/lib/content-style';
import { confidenceStateToken } from '@/lib/color-vision-palette';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label?: string;
  sampleSize?: number;
  details?: Array<{
    label: string;
    value: string;
  }>;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ level, label, sampleSize, details }: ConfidenceBadgeProps) {
  const displayLabel = label ?? confidenceCopy(level, sampleSize);
  const token = confidenceStateToken(level);
  const sampleCopy = sampleSize !== undefined ? ` Sample size ${sampleSize}.` : '';
  const badge = (
    <span
      aria-label={`${displayLabel}.${sampleCopy} ${token.meaning}. Indicator ${token.indicator}.`}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 font-black leading-none" aria-hidden="true">
        {token.indicator}
      </span>
      {displayLabel}
      {sampleSize !== undefined && label ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
    </span>
  );

  if (!details?.length) return badge;

  return (
    <div className="inline-block rounded-xl border border-slate-200 bg-white p-2 text-left shadow-sm">
      {badge}
      <dl className="mt-2 grid gap-2 text-xs normal-case tracking-normal text-slate-700">
        {details.map((detail) => (
          <div key={detail.label}>
            <dt className="font-black text-slate-950">{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
