import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { GroupBuyCoordinator } from '@/components/group-buy-coordinator';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata({
    path: '/group-buy-coordinator',
    title: 'Group buy coordinator | GroceryView',
    description: 'Coordinate a grocery group buy, invite participating households, and verify when the bulk tier unlocks.',
    noIndex: true
  });
}

export default function GroupBuyCoordinatorPage() {
  return (
    <PageShell>
      <Eyebrow>Household buying</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Group buy coordinator</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        A small coordination surface for testing the create → invite → unlock flow without checkout automation or unverified price claims.
      </p>

      <Card className="mt-6 border-sky-200 bg-sky-50/70">
        <h2 className="text-xl font-black text-slate-950">Bulk-tier rule</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
          The coordinator household counts as one participant; inviting two more unique households unlocks the bulk-tier state.
        </p>
      </Card>

      <div className="mt-6">
        <GroupBuyCoordinator />
      </div>
    </PageShell>
  );
}
