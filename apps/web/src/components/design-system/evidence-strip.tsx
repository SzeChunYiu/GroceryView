import type { VerifiedEvidence } from '@/lib/mvp/types';
import { formatConfidenceLabel, formatDate, formatFreshness } from '@/lib/mvp/format';
import { cn } from '@/lib/utils';

export function EvidenceStrip({ evidence, className }: Readonly<{ evidence: VerifiedEvidence; className?: string }>) {
  if (evidence.observationCount <= 0) {
    return (
      <p className={cn('text-[length:var(--gv-text-micro)] font-medium text-[color:var(--gv-warning)]', className)}>
        No verified observations for this panel yet.
      </p>
    );
  }

  const items = [
    { label: 'Source', value: evidence.sourceLabel },
    { label: 'Updated', value: formatDate(evidence.lastObservedAt) },
    { label: 'Freshness', value: formatFreshness(evidence.freshnessLabel) },
    { label: 'Confidence', value: formatConfidenceLabel(evidence.confidenceLabel) },
    { label: 'Observations', value: evidence.observationCount.toLocaleString('sv-SE') }
  ];

  return (
    <div
      aria-label="Source evidence"
      className={cn(
        'flex flex-wrap gap-x-3 gap-y-1 text-[length:var(--gv-text-micro)] font-medium leading-5 text-[color:var(--gv-muted)]',
        className
      )}
    >
      {items.map((item) => (
        <span key={item.label}>
          <span className="sr-only">{item.label}: </span>
          {item.value}
        </span>
      ))}
    </div>
  );
}
