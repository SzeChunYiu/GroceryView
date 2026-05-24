import { Card, Eyebrow, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

const countryCronRows = [
  { country: 'Sweden', code: 'SE', timezone: 'Europe/Stockholm' },
  { country: 'Norway', code: 'NO', timezone: 'Europe/Oslo' },
  { country: 'Iceland', code: 'IS', timezone: 'Atlantic/Reykjavik' }
];

export function generateMetadata() {
  return routeMetadata({
    path: '/account/email-prefs',
    title: 'MyFlyer email preferences | GroceryView',
    description: 'Opt in to the weekly GroceryView MyFlyer email digest and review the Monday 06:00 country-specific delivery contract.',
    noIndex: true
  });
}

export const dynamic = 'force-static';

export default function AccountEmailPrefsPage() {
  return (
    <PageShell>
      <Eyebrow>Account email preferences</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Weekly MyFlyer email digest opt-in</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Choose whether GroceryView may send a weekly HTML MyFlyer digest to your verified account email. The static snapshot shows the production contract only; saving the preference requires a signed-in account session.
      </p>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <form className="space-y-5" aria-describedby="my-flyer-email-help">
          <label className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <input
              aria-describedby="my-flyer-email-help"
              className="mt-1 h-5 w-5 rounded border-slate-300 text-indigo-700"
              name="myFlyerWeeklyEmailOptIn"
              type="checkbox"
            />
            <span>
              <span className="block text-lg font-black text-slate-950">Email me my weekly MyFlyer</span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-700">
                I consent to receive one personalised grocery flyer email per week for my selected country. The email includes verified flyer rows only and links back to manage preferences or unsubscribe.
              </span>
            </span>
          </label>
          <p id="my-flyer-email-help" className="rounded-2xl bg-white p-4 text-sm font-semibold leading-6 text-slate-700">
            Production persistence writes this checkbox to <code className="rounded bg-indigo-50 px-1 py-0.5 text-indigo-900">notification_subscriptions</code> with <code className="rounded bg-indigo-50 px-1 py-0.5 text-indigo-900">channel=email</code>, <code className="rounded bg-indigo-50 px-1 py-0.5 text-indigo-900">product_id=my-flyer-weekly:&lt;country&gt;</code>, and <code className="rounded bg-indigo-50 px-1 py-0.5 text-indigo-900">active=true</code>. Anonymous static visitors cannot create a subscription.
          </p>
          <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white opacity-60" disabled type="button">
            Sign in to save preference
          </button>
        </form>
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Cron contract</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight">Monday 06:00 per country</h2>
        <p className="mt-3 text-sm leading-6 text-slate-700">
          The server cron sender uses <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">0 6 * * 1</code> in each country timezone, renders HTML through <code className="rounded bg-white/80 px-1 py-0.5 text-emerald-900">buildMyFlyerEmail</code>, and skips users with no verified flyer rows instead of sending empty or estimated offers.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {countryCronRows.map((row) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={row.code}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{row.code}</p>
              <p className="mt-1 text-lg font-black text-slate-950">{row.country}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">Monday 06:00 · {row.timezone}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <TopSpreads limit={5} />
        <SourceCoverage />
      </div>
    </PageShell>
  );
}
