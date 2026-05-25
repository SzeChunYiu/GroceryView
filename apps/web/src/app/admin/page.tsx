import Link from 'next/link';
import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import {
  communityModerationQueue,
  moderationPriorityLabel,
  moderationQueueTypeLabel,
  moderationStatusLabel
} from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin',
    title: 'Admin moderation queue | GroceryView',
    description: 'Unified admin queue for flagged reviews, price reports, and duplicate product reports.',
    noIndex: true
  });
}

export default function AdminPage() {
  const flaggedReviews = communityModerationQueue.filter((item) => item.type === 'flagged_review').length;
  const priceReports = communityModerationQueue.filter((item) => item.type === 'price_report').length;
  const duplicateReports = communityModerationQueue.filter((item) => item.type === 'duplicate_product_report').length;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">Admin queue</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Community moderation queue</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Triage flagged reviews, suspicious price reports, and duplicate product reports before community data affects shopper-facing prices or catalog search.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Moderation queue summary">
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Flagged reviews</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{flaggedReviews}</p>
          </div>
          <div className="rounded-[1.5rem] border border-sky-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-sky-800">Price reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{priceReports}</p>
          </div>
          <div className="rounded-[1.5rem] border border-violet-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-800">Duplicate reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{duplicateReports}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4" aria-label="Unified moderation queue">
          {communityModerationQueue.map((item) => (
            <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm" key={item.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                    {moderationQueueTypeLabel(item.type)} · {moderationStatusLabel(item.status)} · {item.reportCount} report(s)
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString('sv-SE')}</p>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">{moderationPriorityLabel(item.priority)}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{item.detail}</p>
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
                Moderator action: {item.actionLabel}
              </p>
            </article>
          ))}
        </section>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="rounded-full bg-amber-800 px-5 py-3 text-sm font-black text-white" href="/admin/reports">Review community reports</Link>
          <Link className="rounded-full border border-slate-300 px-5 py-3 text-sm font-black text-slate-800" href="/admin/duplicates">Open duplicate review</Link>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
