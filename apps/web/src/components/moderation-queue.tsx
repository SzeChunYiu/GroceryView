'use client';

import { useMemo, useState } from 'react';

import {
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel,
  type CommunityModerationQueueItem
} from '@/lib/reviews';

type ModerationAction = 'resolve' | 'ignore';
type ModerationQueueItem = CommunityModerationQueueItem & {
  decision?: {
    action: ModerationAction;
    decidedAt: string;
    decidedBy: string;
    note: string;
  };
};

type ModerationQueueProps = {
  initialItems: ModerationQueueItem[];
};

function isPending(item: ModerationQueueItem) {
  return item.status === 'reported' || item.status === 'under_review';
}

export function ModerationQueue({ initialItems }: ModerationQueueProps) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const pendingQueue = useMemo(() => items.filter(isPending), [items]);
  const queueCounts = useMemo(() => ({
    highPriority: pendingQueue.filter((item) => item.priority === 'high').length,
    listComments: pendingQueue.filter((item) => item.type === 'flagged_list_comment').length,
    reviews: pendingQueue.filter((item) => item.type === 'flagged_review').length,
    total: pendingQueue.length
  }), [pendingQueue]);

  async function decide(itemId: string, action: ModerationAction) {
    setUpdatingId(itemId);
    setError(null);
    try {
      const response = await fetch('/api/moderation', {
        body: JSON.stringify({ action, id: itemId, moderator: 'admin' }),
        headers: { 'content-type': 'application/json' },
        method: 'POST'
      });
      if (!response.ok) throw new Error('Moderation action failed.');
      const payload = await response.json() as { item: ModerationQueueItem };
      setItems((current) => current.map((item) => item.id === itemId ? payload.item : item));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Moderation action failed.');
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <>
      <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Moderation queue summary">
        <div className="rounded-[1.5rem] border border-rose-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Pending</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.total}</p>
        </div>
        <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">High priority</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.highPriority}</p>
        </div>
        <div className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">List comments</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.listComments}</p>
        </div>
        <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Reviews</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.reviews}</p>
        </div>
      </section>

      <section className="mt-6 grid gap-4" aria-label="Moderation queue items">
        {error ? (
          <p className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-950">{error}</p>
        ) : null}
        {pendingQueue.map((item) => (
          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                  {moderationQueueTypeLabel(item.type)} · {moderationPriorityLabel(item.priority)} · {moderationStatusLabel(item.status)}
                </p>
                <h2 className="mt-2 text-2xl font-black text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.detail}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  {item.reportCount} report(s) · {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString('sv-SE')}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2" aria-label={`Actions for ${item.title}`}>
                <button
                  className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-emerald-300"
                  disabled={updatingId === item.id}
                  onClick={() => { void decide(item.id, 'resolve'); }}
                  type="button"
                >
                  Resolve
                </button>
                <button
                  className="rounded-full bg-slate-800 px-4 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"
                  disabled={updatingId === item.id}
                  onClick={() => { void decide(item.id, 'ignore'); }}
                  type="button"
                >
                  Ignore
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
