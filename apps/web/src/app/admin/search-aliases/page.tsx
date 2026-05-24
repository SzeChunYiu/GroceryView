import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import {
  rejectionReasonLabelFor,
  searchAliasRejectionReasons,
  searchAliasReviewCandidates,
  type SearchAliasRejectionReason
} from '@/lib/search-alias-review';

const rejectionReasonIds = searchAliasRejectionReasons.map((reason) => reason.id as SearchAliasRejectionReason);

export default function SearchAliasReviewPage() {
  return (
    <PageShell>
      <Eyebrow>Admin review</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Search alias review</h1>
      <p className="mt-3 max-w-3xl text-lg text-slate-700">
        Review rejected no-result aliases with structured rejection reasons before they are used to improve search matching.
      </p>

      <Card className="mt-6 border-amber-200 bg-amber-50/70">
        <h2 className="text-2xl font-black text-slate-950">Reviewer rejection reason options</h2>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Rejections must pick one reason: bad query, wrong product, duplicate alias, or insufficient confidence.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {searchAliasRejectionReasons.map((reason) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={reason.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">{reason.id.replaceAll('_', ' ')}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{reason.label}</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{reason.detail}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-4">
        {searchAliasReviewCandidates.map((candidate) => (
          <Card key={candidate.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{candidate.query}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{candidate.suggestedAlias}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-600">Candidate product: {candidate.productName}</p>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">{candidate.evidence}</p>
              </div>
              <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700">
                confidence {Math.round(candidate.confidence * 100)}%
              </p>
            </div>
            <div className="mt-5 grid gap-2 md:grid-cols-4">
              {rejectionReasonIds.map((reason) => (
                <button
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-black text-slate-700"
                  key={`${candidate.id}-${reason}`}
                  type="button"
                >
                  Reject: {rejectionReasonLabelFor(reason)}
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
