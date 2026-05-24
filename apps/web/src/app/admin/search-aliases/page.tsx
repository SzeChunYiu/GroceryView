'use client';

import { useEffect, useMemo, useState } from 'react';
import { loadPendingSearchAliases, postSearchAliasDecision, type PendingSearchAlias, type SearchAliasDecision } from '@/lib/search-alias-review';

type DecisionState = {
  aliasId: string;
  decision: SearchAliasDecision;
} | null;

export default function SearchAliasesAdminPage() {
  const [aliases, setAliases] = useState<PendingSearchAlias[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [decisionState, setDecisionState] = useState<DecisionState>(null);
  const [reviewerNote, setReviewerNote] = useState('');

  useEffect(() => {
    let isMounted = true;
    loadPendingSearchAliases()
      .then((pendingAliases) => {
        if (!isMounted) return;
        setAliases(pendingAliases);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load pending search aliases.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const pendingCountLabel = useMemo(() => `${aliases.length.toLocaleString('sv-SE')} pending aliases`, [aliases.length]);

  async function submitDecision(aliasId: string, decision: SearchAliasDecision) {
    setDecisionState({ aliasId, decision });
    setError(null);
    try {
      await postSearchAliasDecision({ aliasId, decision, reviewerNote });
      setAliases((currentAliases) => currentAliases.filter((alias) => alias.id !== aliasId));
      setReviewerNote('');
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : 'Unable to post approve_pending_search_alias decision.');
    } finally {
      setDecisionState(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-800">Admin review</p>
      <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Search alias review</h1>
          <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
            Signed-in reviewers load pending aliases, inspect evidence, and post approve_pending_search_alias decisions to the reviewer endpoint.
          </p>
        </div>
        <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-950">{isLoading ? 'Loading pending aliases…' : pendingCountLabel}</p>
      </div>

      {error ? <p className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-black text-rose-900">{error}</p> : null}

      <label className="mt-6 block text-sm font-black text-slate-950" htmlFor="reviewer-note">
        Reviewer note applied to the next decision
        <textarea
          className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 p-3 text-sm font-semibold text-slate-900"
          id="reviewer-note"
          onChange={(event) => setReviewerNote(event.target.value)}
          placeholder="Optional operational note for this approve_pending_search_alias decision"
          value={reviewerNote}
        />
      </label>

      <section className="mt-6 grid gap-4">
        {!isLoading && aliases.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-sm font-bold text-slate-600">No pending search aliases are waiting for review.</p>
        ) : null}
        {aliases.map((alias) => (
          <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" key={alias.id}>
            <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{alias.normalizedQuery}</p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{alias.query} → {alias.suggestedAlias}</h2>
                <p className="mt-2 text-sm font-semibold text-slate-700">Target: {alias.targetProductName} ({alias.targetProductSlug})</p>
                <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-xs font-bold text-slate-600">{alias.evidenceLabel} · queued {alias.createdAt.slice(0, 10)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                  disabled={decisionState?.aliasId === alias.id}
                  onClick={() => submitDecision(alias.id, 'approve')}
                  type="button"
                >
                  {decisionState?.aliasId === alias.id && decisionState.decision === 'approve' ? 'Approving…' : 'Approve alias'}
                </button>
                <button
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-black text-white disabled:opacity-60"
                  disabled={decisionState?.aliasId === alias.id}
                  onClick={() => submitDecision(alias.id, 'reject')}
                  type="button"
                >
                  {decisionState?.aliasId === alias.id && decisionState.decision === 'reject' ? 'Rejecting…' : 'Reject alias'}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
