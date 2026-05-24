import { searchAliasRejectionReasons, searchAliasReviewQueue } from '@/lib/search-alias-review';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/admin/search-aliases');
}

export default function AdminSearchAliasesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Admin search aliases</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950">No-result alias review</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Review rejected no-result aliases with structured feedback so bad query, wrong product, duplicate alias, and insufficient confidence outcomes can improve search matching.
      </p>

      <section aria-labelledby="rejection-reasons-heading" className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 id="rejection-reasons-heading" className="text-2xl font-black text-slate-950">Reviewer rejection reasons</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {searchAliasRejectionReasons.map((reason) => (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={reason.value}>
              <p className="text-lg font-black text-slate-950">{reason.label}</p>
              <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-slate-500">{reason.value}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{reason.helperText}</p>
            </div>
          ))}
        </div>
      </section>

      <section aria-labelledby="alias-review-queue-heading" className="mt-8">
        <h2 id="alias-review-queue-heading" className="text-2xl font-black text-slate-950">Pending alias decisions</h2>
        <div className="mt-4 space-y-4">
          {searchAliasReviewQueue.map((candidate) => (
            <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={candidate.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-black text-slate-950">{candidate.query}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Suggested alias: {candidate.suggestedAlias}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-600">Matched product: {candidate.matchedProductName}</p>
                </div>
                <p className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-black text-indigo-950">Confidence {Math.round(candidate.confidence * 100)}%</p>
              </div>
              <fieldset className="mt-5 rounded-2xl border border-slate-200 p-4">
                <legend className="px-2 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Reject with reason</legend>
                <div className="mt-3 grid gap-2 md:grid-cols-4">
                  {searchAliasRejectionReasons.map((reason) => (
                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700" key={`${candidate.id}-${reason.value}`}>
                      <input className="mr-2" name={`reject-${candidate.id}`} type="radio" value={reason.value} />
                      {reason.label}
                    </label>
                  ))}
                </div>
              </fieldset>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
