import { Card } from '@/components/data-ui';
import { getScanHistoryEndpoint, premiumOcrHistoryTimeline } from '@/lib/scanner-history';

const statusStyles = {
  corrections_pending: 'bg-amber-100 text-amber-950',
  corrected: 'bg-emerald-100 text-emerald-950',
  export_ready: 'bg-sky-100 text-sky-950'
} satisfies Record<string, string>;

export function OcrScanHistoryTimeline() {
  const previewEndpoint = getScanHistoryEndpoint(':userId');

  return (
    <Card className="mt-6 border-violet-200 bg-violet-50/80">
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-violet-800">Signed-in premium history</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{premiumOcrHistoryTimeline.title}</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
            {premiumOcrHistoryTimeline.emptyState} Runtime clients should call <code className="rounded bg-white px-1 py-0.5 text-violet-950">{previewEndpoint}</code> after session verification.
          </p>
          <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-violet-950">
            {premiumOcrHistoryTimeline.privacyCopy}
          </p>
        </div>
        <ol className="relative space-y-3 border-l-4 border-violet-200 pl-5">
          {premiumOcrHistoryTimeline.entries.map((entry) => (
            <li className="relative rounded-2xl bg-white/85 p-4 shadow-sm" key={entry.id}>
              <span className="absolute -left-[1.95rem] top-5 h-4 w-4 rounded-full border-4 border-violet-200 bg-white" aria-hidden="true" />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black text-slate-950">{entry.capturedAtLabel}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{entry.retailerLabel}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${statusStyles[entry.correctionStatus]}`}>
                  {entry.statusLabel}
                </span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{entry.lineItemSummary}</p>
            </li>
          ))}
        </ol>
      </div>
    </Card>
  );
}
