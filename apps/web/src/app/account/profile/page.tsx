import Link from 'next/link';
import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage } from '@/components/data-ui';
import { accountProfile } from '@/lib/demo-data';

export const dynamic = 'force-static';

export default function AccountProfilePage() {
  return (
    <PageShell>
      <Eyebrow>Account profile</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Household account profile</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        This static profile renders the account driver record directly from demo data so saved-route, budget, and preference surfaces have concrete rows.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Shopper</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{accountProfile.shopperName}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Saved since {accountProfile.savedSince}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Home district</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{accountProfile.homeDistrict}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{accountProfile.preferredStore}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Weekly budget</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-emerald-800">{accountProfile.weeklyBudget}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Used by basket and savings routes.</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-semibold text-slate-600">Profile completeness</p>
          <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">{accountProfile.profileCompleteness}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Preferences and route links are populated.</p>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <Eyebrow>Preferences</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Profile settings with saved states</h2>
          <div className="mt-5 divide-y divide-slate-200">
            {accountProfile.preferences.map((preference) => (
              <div className="grid gap-3 py-4 md:grid-cols-[1fr_auto]" key={preference.label}>
                <div>
                  <p className="font-black text-slate-950">{preference.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{preference.value}</p>
                </div>
                <span className="self-start rounded-full bg-emerald-50 px-3 py-1 text-sm font-black text-emerald-900">
                  {preference.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <Eyebrow>Saved routes</Eyebrow>
          <h2 className="mt-2 text-2xl font-black tracking-tight">Account-linked grocery surfaces</h2>
          <div className="mt-5 grid gap-3">
            {accountProfile.routeLinks.map((route) => (
              <Link className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-emerald-700 hover:bg-emerald-50/60" href={route.href} key={route.href}>
                <p className="font-black text-slate-950">{route.label}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{route.detail}</p>
              </Link>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <NoVerifiedData route="account-profile" title="Account profile uses static demo records until authenticated production records are available" />
      </div>
      <div className="mt-6"><SourceCoverage /></div>
    </PageShell>
  );
}
