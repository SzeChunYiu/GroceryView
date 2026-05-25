import Link from 'next/link';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { buildNewArrivalFeed } from '@/lib/freshness';
import { categoryLabels, pricedProducts } from '@/lib/openprices-products';
import { routeMetadata } from '@/lib/seo';

const newArrivalFeed = buildNewArrivalFeed(pricedProducts, { categoryLabels, limit: 12, windowDays: 30 });
const firstSeenCount = newArrivalFeed.filter((item) => item.isFirstSeenInWindow).length;
const freshest = newArrivalFeed[0];

export function generateMetadata() {
  return routeMetadata({
    path: '/new-arrivals',
    title: 'New grocery arrivals | GroceryView',
    description: 'Products first seen in the latest ingestion window with source and freshness metadata.'
  });
}

export default function NewArrivalsPage() {
  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">Latest ingestion window</StatusBadge>
            <StatusBadge tone="warning">No inferred assortment</StatusBadge>
          </>
        }
        eyebrow="Assortment changes"
        title="New arrivals feed"
      >
        <p>
          Products are ranked by first-seen observation date so shoppers and operators can review assortment changes, not only price movement. Rows keep source and freshness metadata visible before any product claim is made.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="New arrivals summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Feed rows</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{newArrivalFeed.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">latest observed products reviewed</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">First seen in window</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{firstSeenCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">products with first observation inside the window</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Freshest first seen</p>
          <p className="mt-2 text-xl font-black text-slate-950">{freshest?.firstSeenAt ?? 'No dated rows'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">source observation date</p>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Newly ingested products">
        {newArrivalFeed.map((item) => (
          <Link className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-700" href={item.href} key={item.slug}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{item.category}</p>
                <h2 className="mt-2 text-xl font-black leading-6 text-slate-950">{item.name}</h2>
                <p className="mt-1 text-sm font-semibold text-slate-600">{item.brand}</p>
              </div>
              <StatusBadge tone={item.isFirstSeenInWindow ? 'success' : 'warning'}>
                {item.isFirstSeenInWindow ? 'New' : 'Fresh'}
              </StatusBadge>
            </div>
            <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
              <p>First seen: <span className="font-black text-slate-950">{item.firstSeenAt}</span></p>
              <p>Last observed: <span className="font-black text-slate-950">{item.lastObservedAt}</span></p>
              <p>Freshness: <span className="font-black text-slate-950">{item.freshness.label}</span></p>
              <p>Source depth: <span className="font-black text-slate-950">{item.observationCount.toLocaleString('sv-SE')} observations</span></p>
            </div>
            <p className="mt-3 text-xs font-bold leading-5 text-slate-500">{item.sourceLabel}. {item.freshness.refreshHint}</p>
          </Link>
        ))}
      </section>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <Eyebrow>Claim boundary</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          A row means the product appeared in verified source observations during the ingestion window. GroceryView does not infer local shelf availability, permanent assortment status, or store-level inventory from this feed.
        </p>
      </Card>
    </PageShell>
  );
}
