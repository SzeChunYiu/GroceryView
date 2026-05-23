import { CircleHelp } from 'lucide-react';

import { confidenceBadgeCopy } from '@/lib/copy';

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
      <span className="relative inline-flex items-center">
        <button
          aria-label={`${confidenceBadgeCopy.tooltipLabel}: ${confidenceBadgeCopy.tooltip}`}
          className="peer inline-flex h-4 w-4 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
          type="button"
        >
          <CircleHelp aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 hidden w-56 rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold normal-case leading-5 tracking-normal text-slate-700 shadow-lg peer-focus:block peer-hover:block"
        >
          {confidenceBadgeCopy.tooltip}
        </span>
      </span>
    </span>
  );
}
