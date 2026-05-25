/**
 * Displays GroceryView's source-confidence state for a price row or aggregate.
 *
 * Accessibility: the visible badge text is backed by an `aria-label` that
 * expands sample size, freshness, verification, and color-vision indicator
 * details so confidence is not communicated by color alone.
 *
 * Dependencies: confidence copy comes from content-style rules, the glyph and
 * meaning come from the color-vision palette, freshness labels come from the
 * freshness helper, and supporting copy is localized through the grocery
 * translator.
 *
 * Edge cases: missing labels fall back to confidence copy, missing sample sizes
 * are omitted from the visible badge, invalid/empty detail arrays render only
 * the badge, and provided verification text is trimmed before display.
 */
import { confidenceCopy, type ConfidenceLevel } from '@/lib/content-style';
import { confidenceStateToken } from '@/lib/color-vision-palette';
import { getPriceFreshness } from '@/lib/freshness';
import { groceryTranslator, type SupportedLocale } from '@/lib/i18n';

type ConfidenceBadgeProps = {
  level: ConfidenceLevel;
  label?: string;
  observedAt?: string | number | Date | null;
  sampleSize?: number;
  details?: Array<{
    label: string;
    value: string;
  }>;
  verificationLabel?: string;
  locale?: SupportedLocale;
};

const levelClasses: Record<ConfidenceBadgeProps["level"], string> = {
  high: "border-emerald-200 bg-emerald-50 text-emerald-800",
  medium: "border-sky-200 bg-sky-50 text-sky-800",
  low: "border-amber-200 bg-amber-50 text-amber-900",
};

export function ConfidenceBadge({ level, label, observedAt, sampleSize, details, verificationLabel, locale }: ConfidenceBadgeProps) {
  const t = groceryTranslator(locale);
  const displayLabel = label ?? confidenceCopy(level, sampleSize);
  const token = confidenceStateToken(level);
  const sampleCopy = sampleSize !== undefined ? t('confidence-badge.sampleSize', { sampleSize }) : '';
  const freshness = observedAt !== undefined ? getPriceFreshness(observedAt) : null;
  const verificationCopy = verificationLabel?.trim();
  const detailCopy = [
    sampleCopy,
    freshness ? t('confidence-badge.freshness', { label: freshness.label, refreshHint: freshness.refreshHint }) : '',
    verificationCopy ? t('confidence-badge.verification', { verificationLabel: verificationCopy }) : '',
    t('confidence-badge.indicator', { meaning: token.meaning, indicator: token.indicator })
  ].filter(Boolean).join(' ');
  const badge = (
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
