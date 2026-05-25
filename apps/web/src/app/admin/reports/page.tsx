import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import {
  communityReviewTrustScore,
  defaultCommunityPriceReviews,
  moderationStatusLabel,
  suspiciousCommunityPriceReports
} from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/reports',
    title: 'Admin community reports | GroceryView',
    description: 'Moderation queue for suspicious community-submitted prices and reviews.',
    noIndex: true
  });
}

export default function AdminReportsPage() {
  const reportedCount = suspiciousCommunityPriceReports.length;
  const underReviewCount = suspiciousCommunityPriceReports.filter((review) => review.moderationStatus === 'under_review').length;

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-800">Admin reports</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Suspicious community price reports</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Review community-submitted prices and reviews that shoppers flagged as suspicious before they influence trust scoring.
          </p>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Community report moderation status">
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Flagged reports</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{reportedCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">Under review</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{underReviewCount}</p>
          </div>
          <div className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Active reviews</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{defaultCommunityPriceReviews.length - reportedCount}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4" aria-label="Flagged community review queue">
          {suspiciousCommunityPriceReports.map((review) => (
            <article className="rounded-[1.5rem] border border-amber-200 bg-white p-5 shadow-sm" key={review.id}>
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-800">
                    {moderationStatusLabel(review.moderationStatus)} · {review.reportCount ?? 0} report(s)
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-slate-950">{review.productName}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{review.priceLabel} · {review.storeName}</p>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800">Trust {communityReviewTrustScore(review)}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-700">{review.body}</p>
              <p className="mt-3 rounded-2xl bg-amber-50 p-3 text-sm font-bold leading-6 text-amber-950">
                Moderator note: {review.lastReportReason ?? 'Community flag needs review.'}
              </p>
            </article>
          ))}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
