import { Card, Eyebrow, NoVerifiedData, PageShell, SourceCoverage, TopSpreads } from '@/components/data-ui';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/account/profile');
}

export const dynamic = 'force-static';

export default function AccountProfilePage() {
  return (
    <PageShell>
      <NoVerifiedData route="account-profile" title="Account profile has no authenticated production record in this static snapshot" />
      <Card className="mt-6 border-lime-200 bg-lime-50">
        <Eyebrow>Dietary onboarding</Eyebrow>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Dietary profile setup</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
          Signed-in shoppers are prompted to confirm vegetarian, vegan, halal, and allergen preferences as an explicit onboarding step. These choices become the account-level source of truth for safer search filtering, recommendation ranking, price-drop alerts, and basket warnings.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {['Vegetarian', 'Vegan', 'Halal', 'Allergens'].map((step) => (
            <div className="rounded-2xl bg-white p-4 shadow-sm" key={step}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-800">Capture</p>
              <p className="mt-1 text-lg font-black text-slate-950">{step}</p>
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
