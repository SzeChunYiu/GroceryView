import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { pendingSearchAliasReviews, searchAliasReviewContract } from '@/lib/search-alias-review';

export const dynamic = 'force-static';

export default function AdminSearchAliasesPage() {
  return (
    <PageShell>
      <Eyebrow>Admin search aliases</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Pending search alias review</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Render pending faceted-search:no-result aliases, select the best existing product match, and keep confidence/freshness metadata visible. This page is UI-only until {searchAliasReviewContract.endpointDependency} ships.
      </p>

      <Card className="mt-6 border-indigo-200 bg-indigo-50/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-800">Reviewer endpoint dependency</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{searchAliasReviewContract.approveAction}</h2>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-indigo-900">{pendingSearchAliasReviews.length} pending alias(es)</p>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {pendingSearchAliasReviews.map((review) => (
            <form className="rounded-2xl border border-white bg-white p-4 shadow-sm" key={review.id}>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{review.source}</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">{review.query}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">normalizedQuery {review.normalizedQuery} · submitted {review.submittedAt}</p>
              <p className="mt-2 rounded-xl bg-indigo-50 p-3 text-sm font-bold text-indigo-950">{review.freshnessLabel}</p>
              <label className="mt-4 block text-sm font-black text-slate-950" htmlFor={`${review.id}-product`}>
                Select product match
                <select className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800" id={`${review.id}-product`} name="selectedProductSlug">
                  {review.candidateProducts.map((candidate) => (
                    <option key={candidate.productSlug} value={candidate.productSlug}>
                      {candidate.productName} · confidence {Math.round(candidate.confidence * 100)}%
                    </option>
                  ))}
                </select>
              </label>
              <button className="mt-4 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white disabled:opacity-60" disabled type="button">
                Approve after endpoint lands
              </button>
            </form>
          ))}
        </div>
        <ul className="mt-5 grid gap-2 text-sm font-semibold leading-6 text-indigo-950 md:grid-cols-3">
          {searchAliasReviewContract.guardrails.map((guardrail) => <li className="rounded-2xl bg-white p-3" key={guardrail}>• {guardrail}</li>)}
        </ul>
      </Card>
    </PageShell>
  );
}
