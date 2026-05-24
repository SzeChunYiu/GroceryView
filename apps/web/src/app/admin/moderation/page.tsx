import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { prioritizedModerationQueue } from '@/lib/community-reviews';

export const dynamic = 'force-static';

const riskStyles = {
  high: 'bg-rose-100 text-rose-950',
  medium: 'bg-amber-100 text-amber-950',
  low: 'bg-emerald-100 text-emerald-950'
};

export default function AdminModerationPage() {
  return (
    <PageShell>
      <Eyebrow>Admin moderation</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Review moderation confidence scoring</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Community review content is scored before a moderator opens the queue. Higher riskScore rows appear first while confidenceScore, reasons, and evidence discounts stay visible for human review.
      </p>

      <Card className="mt-6 border-rose-200 bg-rose-50/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-rose-800">Risk-prioritized queue</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Highest moderation risk first</h2>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-rose-900">{prioritizedModerationQueue.length} scored review(s)</p>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {prioritizedModerationQueue.map((review, index) => (
            <section className="rounded-2xl border border-white bg-white p-4 shadow-sm" key={review.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Priority #{index + 1}</p>
                  <h3 className="mt-1 text-lg font-black text-slate-950">{review.productName}</h3>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${riskStyles[review.riskBand]}`}>{review.riskBand}</span>
              </div>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">{review.content}</p>
              <div className="mt-3 grid gap-2 text-sm font-black text-slate-950 sm:grid-cols-2">
                <p className="rounded-xl bg-slate-50 p-3">riskScore {review.riskScore}/100</p>
                <p className="rounded-xl bg-slate-50 p-3">confidenceScore {review.confidenceScore}/100</p>
              </div>
              <ul className="mt-3 space-y-1 text-xs font-bold leading-5 text-slate-600">
                {review.moderationReasons.map((reason) => <li key={reason}>• {reason}</li>)}
              </ul>
            </section>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
