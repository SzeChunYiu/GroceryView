import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import {
  communityModerationQueue,
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel
} from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

const freshnessVotes = [
  {
    actionLabel: 'Check freshness vote',
    detail: 'Three shoppers marked the oat milk price as stale after the latest shelf check; verify before it feeds alerts.',
    id: 'queue-freshness-oat-milk-2026-05-24',
    priority: 'medium' as const,
    reportCount: 3,
    status: 'under_review' as const,
    submittedAt: '2026-05-24T13:20:00.000Z',
    submittedBy: 'Freshness vote cohort',
    title: 'Oat milk freshness votes',
    type: 'freshness_vote'
  }
];

const reviewQueue = [...communityModerationQueue, ...freshnessVotes].sort((left, right) => (
  Date.parse(right.submittedAt) - Date.parse(left.submittedAt)
));

const queueCounts = {
  duplicateReports: reviewQueue.filter((item) => item.type === 'duplicate_product_report').length,
  flaggedReviews: reviewQueue.filter((item) => item.type === 'flagged_review').length,
  freshnessVotes: reviewQueue.filter((item) => item.type === 'freshness_vote').length
};

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/reviews',
    title: 'Admin review moderation queue | GroceryView',
    description: 'Approve, hide, or escalate flagged reviews, duplicate reports, and freshness votes.',
    noIndex: true
  });
}

function typeLabel(type: string) {
  if (type === 'freshness_vote') return 'Freshness vote';
  return moderationQueueTypeLabel(type as Parameters<typeof moderationQueueTypeLabel>[0]);
}

export default function AdminReviewsPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-800">Admin reviews</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Community review moderation queue</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            One admin queue groups flagged reviews, duplicate product reports, and freshness votes before community proof changes shopper-facing trust scores.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Review moderation queue summary">
          <div className="rounded-[1.5rem] border border-rose-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-800">Flagged reviews</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.flaggedReviews}</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Duplicate reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.duplicateReports}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Freshness votes</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{queueCounts.freshnessVotes}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4" aria-label="Moderation queue items">
          {reviewQueue.map((item) => (
            <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                    {typeLabel(item.type)} · {moderationPriorityLabel(item.priority)} · {moderationStatusLabel(item.status)}
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{item.detail}</p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                    {item.reportCount} signal(s) · {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString('sv-SE')}
                  </p>
                </div>
                <div className="flex min-w-56 flex-wrap gap-2 md:justify-end" aria-label={`Actions for ${item.title}`}>
                  <button className="rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white" type="button">Approve</button>
                  <button className="rounded-full bg-slate-800 px-4 py-2 text-sm font-black text-white" type="button">Hide</button>
                  <button className="rounded-full bg-rose-700 px-4 py-2 text-sm font-black text-white" type="button">Escalate</button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
