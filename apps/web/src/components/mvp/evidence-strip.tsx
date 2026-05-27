import type { VerifiedEvidence } from '@/lib/mvp/types';
import { formatConfidenceLabel, formatDate, formatFreshness } from '@/lib/mvp/format';

export function EvidenceStrip({ evidence }: Readonly<{ evidence: VerifiedEvidence }>) {
  if (evidence.observationCount <= 0) {
    return <p className="text-xs font-semibold text-amber-800">No verified observations for this panel yet.</p>;
  }
  return (
    <p className="text-xs font-semibold leading-5 text-slate-600">
      {evidence.sourceLabel} · {formatFreshness(evidence.freshnessLabel)} · {formatConfidenceLabel(evidence.confidenceLabel)} ·{' '}
      {evidence.observationCount.toLocaleString('sv-SE')} observations · updated {formatDate(evidence.lastObservedAt)}
    </p>
  );
}
