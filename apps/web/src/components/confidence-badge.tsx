import { confidenceCopy, type ConfidenceLevel } from '@/lib/content-style';
import { confidenceStateToken } from '@/lib/color-vision-palette';
import { freshnessBadgeAriaLabel, freshnessBadgeTone, getPriceFreshness, type FreshnessBadgeTone } from '@/lib/freshness';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label?: string;
  observedAt?: string | number | Date | null;
  sampleSize?: number;
  verificationLabel?: string;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

const freshnessToneClasses: Record<FreshnessBadgeTone, string> = {
  positive: "border-emerald-200 bg-emerald-50 text-emerald-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-rose-200 bg-rose-50 text-rose-900",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

export function ConfidenceBadge({ level, label, observedAt, sampleSize, verificationLabel }: ConfidenceBadgeProps) {
  const displayLabel = label ?? confidenceCopy(level, sampleSize);
  const token = confidenceStateToken(level);
  const sampleCopy = sampleSize !== undefined ? `Sample size ${sampleSize}.` : '';
  const freshness = observedAt !== undefined ? getPriceFreshness(observedAt) : null;
  const verificationCopy = verificationLabel?.trim();
  const detailCopy = [
    sampleCopy,
    freshness ? `Freshness ${freshness.label}. ${freshness.refreshHint}` : '',
    verificationCopy ? `Verification ${verificationCopy}.` : '',
    `${token.meaning}. Indicator ${token.indicator}.`
  ].filter(Boolean).join(' ');

  return (
    <span
      aria-label={`${displayLabel}. ${detailCopy}`}
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${levelClasses[level]}`}
    >
      <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-current px-1 font-black leading-none" aria-hidden="true">
        {token.indicator}
      </span>
      {displayLabel}
      {sampleSize !== undefined && label ? <span className="normal-case tracking-normal">n={sampleSize}</span> : null}
      {freshness ? <span className="normal-case tracking-normal">{freshness.label}</span> : null}
      {verificationCopy ? <span className="normal-case tracking-normal">{verificationCopy}</span> : null}
    </span>
  );
}

export function FreshnessBadge({
  context = 'Price freshness',
  observedAt,
}: Readonly<{
  context?: string;
  observedAt: string | number | Date | null | undefined;
}>) {
  const freshness = getPriceFreshness(observedAt);
  const tone = freshnessBadgeTone(freshness.level);

  return (
    <span
      aria-label={freshnessBadgeAriaLabel(freshness, context)}
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${freshnessToneClasses[tone]}`}
      data-freshness-level={freshness.level}
      title={freshness.refreshHint}
    >
      {freshness.label}
    </span>
  );
}
