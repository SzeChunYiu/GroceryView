import { AppNav } from '@/components/app-nav';
import { BottomNav } from '@/components/bottom-nav';
import { ModerationQueue } from '@/components/moderation-queue';
import { MODERATION_RISK_GUIDANCE, MODERATION_RISK_THRESHOLDS, formatModerationThreshold } from '@/lib/community-reviews';
import { communityModerationQueue } from '@/lib/reviews';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/admin/moderation',
    title: 'Admin moderation queue | GroceryView',
    description: 'Resolve or ignore flagged list comments and community reviews before they affect GroceryView trust surfaces.',
    noIndex: true
  });
}

export default function AdminModerationPage() {
  return (
    <div className="min-h-screen bg-[#f5f1e8] text-slate-950">
      <AppNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8 lg:pb-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-rose-800">Admin moderation</p>
        <div className="mt-2 max-w-3xl">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">Reports and abuse queue</h1>
          <p className="mt-3 text-lg leading-8 text-slate-700">
            Review flagged list comments and community reviews before they affect shared lists, trust scores, or shopper-facing price evidence.
          </p>
        </div>

        <ModerationQueue initialItems={communityModerationQueue} />

        <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Moderation risk threshold guidance">
          {MODERATION_RISK_GUIDANCE.map((risk) => (
            <article className="rounded-[1.5rem] border border-emerald-200 bg-white p-5 shadow-sm" key={risk.band}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{risk.label}</p>
              <p className="mt-2 text-3xl font-black text-slate-950">≥ {formatModerationThreshold(risk.threshold)}</p>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">{risk.routing}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-2xl font-black text-slate-950">Threshold configuration</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
            High risk starts at {formatModerationThreshold(MODERATION_RISK_THRESHOLDS.high)}, medium risk starts at {formatModerationThreshold(MODERATION_RISK_THRESHOLDS.medium)}, and anything below remains low risk.
          </p>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}
