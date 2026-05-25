import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import {
  communityModerationQueue,
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel
} from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

const freshnessVoteQueue = [
  {
    id: 'freshness-vote-openprices-dairy',
    title: 'Dairy price freshness vote',
    detail: 'Three shoppers marked the current dairy shelf prices stale after newer receipts appeared for the same products.',
    priority: 'medium' as const,
    reportCount: 3,
    status: 'under_review' as const,
    submittedAt: '2026-05-20T14:15:00.000Z',
    submittedBy: 'Freshness vote monitor',
    typeLabel: 'Freshness vote'
  }
];

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/reviews',
    title: 'Community review moderation queue | GroceryView',
    description: 'Admin queue for flagged reviews, duplicate reports, freshness votes, and reviewer actions.',
    noIndex: true
  });
}

export default function AdminReviewsPage() {
  const reviewQueue = communityModerationQueue.map((item) => ({
    ...item,
    typeLabel: moderationQueueTypeLabel(item.type)
  }));
  const queue = [...reviewQueue, ...freshnessVoteQueue].sort((left, right) => Date.parse(right.submittedAt) - Date.parse(left.submittedAt));
  const flaggedCount = communityModerationQueue.filter((item) => item.type === 'flagged_review').length;
  const duplicateCount = communityModerationQueue.filter((item) => item.type === 'duplicate_product_report').length;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">Admin moderation</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Community review moderation queue</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Flagged reviews, duplicate product reports, and freshness votes are held here until a reviewer approves, hides, or escalates the evidence.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-4" aria-label="Review moderation summary">
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Flagged reviews</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{flaggedCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Duplicate reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{duplicateCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Freshness votes</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{freshnessVoteQueue.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Total queue</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{queue.length}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4" aria-label="Community review moderation work queue">
          {queue.map((item) => (
            <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                    {item.typeLabel} · {moderationStatusLabel(item.status)} · {item.reportCount} report(s)
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{item.submittedBy} · {new Date(item.submittedAt).toLocaleString('sv-SE')}</p>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">{moderationPriorityLabel(item.priority)}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{item.detail}</p>
              <div className="mt-4 flex flex-wrap gap-2" aria-label={`Moderation actions for ${item.title}`}>
                <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" type="button">Approve</button>
                <button className="rounded-full border border-slate-300 px-4 py-2 text-sm font-black text-slate-800" type="button">Hide</button>
                <button className="rounded-full border border-amber-300 px-4 py-2 text-sm font-black text-amber-900" type="button">Escalate</button>
              </div>
            </article>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
