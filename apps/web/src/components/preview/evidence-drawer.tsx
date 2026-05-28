'use client';

import { useRef, useState } from 'react';
import type { VerifiedEvidence } from '@/lib/mvp/types';
import { trackGroceryViewEvent } from '@/lib/analytics';
import { formatConfidenceLabel, formatDate, formatFreshness } from '@/lib/mvp/format';
import { PreviewDrawer } from './preview-drawer';

type EvidenceDrawerProps = {
  evidence: VerifiedEvidence;
  triggerLabel?: string;
};

/** Frontstage evidence only — no source_run_id, raw records, or parser internals. */
export function EvidenceDrawer({ evidence, triggerLabel = 'View evidence' }: Readonly<EvidenceDrawerProps>) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        className="text-xs font-black uppercase tracking-[0.14em] text-emerald-800 underline-offset-2 hover:underline"
        onClick={() => {
          setOpen(true);
          trackGroceryViewEvent({
            eventName: 'evidence_drawer_opened',
            sourcePanel: 'evidence_drawer',
            entityType: 'product',
            entityId: evidence.sourceLabel
          });
        }}
        type="button"
      >
        {triggerLabel}
      </button>
      <PreviewDrawer
        onClose={() => setOpen(false)}
        open={open}
        title="Price evidence"
        triggerRef={triggerRef}
      >
        <dl className="grid gap-3 text-sm font-semibold text-slate-700">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Source</dt>
            <dd className="mt-1 text-slate-950">{evidence.sourceLabel}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Last observed</dt>
            <dd className="mt-1 text-slate-950">{formatDate(evidence.lastObservedAt)}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Confidence</dt>
            <dd className="mt-1 text-slate-950">{formatConfidenceLabel(evidence.confidenceLabel)}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Freshness</dt>
            <dd className="mt-1 text-slate-950">{formatFreshness(evidence.freshnessLabel)}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Rows</dt>
            <dd className="mt-1 text-slate-950">{evidence.observationCount.toLocaleString('sv-SE')} observations</dd>
          </div>
        </dl>
      </PreviewDrawer>
    </>
  );
}
