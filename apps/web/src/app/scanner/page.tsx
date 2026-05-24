import { Card, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { OcrScanHistoryTimeline } from '@/components/ocr-scan-history-timeline';
import { ScannerUploadActions } from '@/components/scanner-upload-actions';
import { routeMetadata } from '@/lib/seo';
import { receiptFedAliasGrowthPlan } from '@/lib/verified-data';

export function generateMetadata() {
  return routeMetadata('/scanner');
}

export const dynamic = 'force-static';

const route = 'scanner';

export default function ScannerPage() {
  return (
    <PageShell>
      <NoVerifiedData route={route} title="Receipt scanner has no production uploads in this static snapshot" />
      <Card className="mt-6 border-indigo-200 bg-indigo-50/80">
        <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-800">Receipt OCR alias growth</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Receipt-fed commodity alias growth</h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Scanner rows can propose loose-item aliases only when they carry {receiptFedAliasGrowthPlan.evidenceRequirement} (chain label + kr + weight): the chain label, observed SEK total, and weight/unit evidence from receipt OCR.
            </p>
            <p className="mt-3 rounded-2xl bg-white/80 p-3 text-sm font-bold leading-6 text-indigo-950">
              No private receipt images are shown here. Alias candidates stay in human review until a reviewer accepts {receiptFedAliasGrowthPlan.reviewAction}.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Candidate rows</p>
              <p className="mt-2 text-4xl font-black text-indigo-950">{receiptFedAliasGrowthPlan.candidates.length}</p>
              <p className="mt-2 text-sm font-semibold text-indigo-900">{receiptFedAliasGrowthPlan.status}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-700">Review action</p>
              <p className="mt-2 break-all text-lg font-black text-indigo-950">{receiptFedAliasGrowthPlan.reviewAction}</p>
            </div>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {receiptFedAliasGrowthPlan.candidates.map((candidate) => (
            <div className="rounded-2xl bg-white/80 p-4" key={candidate.id}>
              <p className="text-sm font-black text-slate-950">{candidate.normalizedAlias}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{candidate.chainLabel} · {candidate.itemTotal} kr · {candidate.quantity} {candidate.comparableUnit}</p>
              <p className="mt-2 text-2xl font-black text-indigo-950">{candidate.unitPrice} kr/{candidate.comparableUnit}</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">Priority {candidate.priority}; evidence {candidate.evidence.join(' · ')}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-2xl bg-white/80 p-4">
          <p className="text-sm font-black text-slate-950">Guardrails</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {receiptFedAliasGrowthPlan.guardrails.map((guardrail) => (
              <li key={guardrail}>• {guardrail}</li>
            ))}
          </ul>
          <p className="mt-3 text-sm font-bold text-indigo-950">Next runtime step: {receiptFedAliasGrowthPlan.nextRuntimeStep}</p>
        </div>
      </Card>
      <ScannerUploadActions />
      <OcrScanHistoryTimeline />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
