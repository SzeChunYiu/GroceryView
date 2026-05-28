import type { ReactNode } from 'react';
import { EvidenceStrip } from './evidence-strip';
import { dsCard, dsEyebrow } from './shared';
import { cn } from '@/lib/utils';
import type { VerifiedEvidence } from '@/lib/mvp/types';

export function ChartShell({
  question,
  title,
  summary,
  chart,
  legend,
  actions,
  evidence,
  tableFallback,
  className
}: Readonly<{
  question?: string;
  title: string;
  summary?: string;
  chart: ReactNode;
  legend?: ReactNode;
  actions?: ReactNode;
  evidence?: VerifiedEvidence;
  tableFallback?: ReactNode;
  className?: string;
}>) {
  return (
    <section className={cn(dsCard, 'p-5', className)} aria-label={title}>
      {question ? <p className={dsEyebrow}>{question}</p> : null}
      <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-extrabold tracking-tight text-[color:var(--gv-ink)]">{title}</h2>
          {summary ? <p className="mt-2 text-[length:var(--gv-text-small)] leading-7 text-[color:var(--gv-ink-soft)]">{summary}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-5 overflow-hidden rounded-[length:var(--gv-radius-control)] border border-[color:var(--gv-border)] bg-[var(--gv-bg-soft)] p-3">
        {chart}
      </div>
      {legend ? <div className="mt-3 flex flex-wrap gap-3 text-[length:var(--gv-text-small)] text-[color:var(--gv-ink-soft)]">{legend}</div> : null}
      {evidence ? (
        <div className="mt-4 rounded-[length:var(--gv-radius-control)] bg-[var(--gv-surface-muted)] px-3 py-2">
          <EvidenceStrip evidence={evidence} />
        </div>
      ) : null}
      {tableFallback ? (
        <div className="mt-4 overflow-x-auto rounded-[length:var(--gv-radius-control)] border border-[color:var(--gv-border)]">
          {tableFallback}
        </div>
      ) : null}
    </section>
  );
}
