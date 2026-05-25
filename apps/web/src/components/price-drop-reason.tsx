import { getPriceDropPercent, getPriceDropReasons, type PriceDropReasonInput } from '@/lib/price-events';

export interface PriceDropReasonProps extends PriceDropReasonInput {
  asDisclosure?: boolean;
  className?: string;
  maxReasons?: number;
  summaryLabel?: string;
}

function formatPercent(value: number | null) {
  if (value === null) return 'price drop';
  return `${Math.round(value * 100)}% drop`;
}

export function PriceDropReason({ asDisclosure = false, className = '', maxReasons = 2, summaryLabel, ...event }: PriceDropReasonProps) {
  const dropPercent = getPriceDropPercent(event);
  const reasons = getPriceDropReasons(event).slice(0, maxReasons);

  if (reasons.length === 0) return null;

  const content = (
    <div className={`rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950 ${className}`.trim()}>
      <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Why this {formatPercent(dropPercent)}?</p>
      <ul className="mt-2 grid gap-2">
        {reasons.map((reason) => (
          <li className="flex gap-2" key={reason.kind}>
            <span aria-hidden="true">{reason.icon}</span>
            <span>
              <span className="font-black">{reason.label}</span>
              <span className="block text-xs font-semibold leading-5 text-amber-900">{reason.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (!asDisclosure) return content;

  return (
    <details className={`rounded-2xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-950 ${className}`.trim()}>
      <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.18em] text-amber-800">
        {summaryLabel ?? `Why this ${formatPercent(dropPercent)}?`}
      </summary>
      <ul className="mt-2 grid gap-2">
        {reasons.map((reason) => (
          <li className="flex gap-2" key={reason.kind}>
            <span aria-hidden="true">{reason.icon}</span>
            <span>
              <span className="font-black">{reason.label}</span>
              <span className="block text-xs font-semibold leading-5 text-amber-900">{reason.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export default PriceDropReason;
