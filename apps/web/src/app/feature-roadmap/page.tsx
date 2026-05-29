import Link from 'next/link';
import { FeaturePlacementMap } from '@/components/feature-placement-map';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { featurePlacementRoadmap } from '@/lib/verified-data';

export const metadata = {
  title: 'Feature roadmap | GroceryView',
  description: 'Where GroceryView places planned shopper features across products, deals, basket, store, and account pages.'
};

const clusters = [
  { id: 'products', label: 'Products', description: 'Decision aids that belong beside product search, product detail, and chain comparison.' },
  { id: 'deals', label: 'Deals', description: 'Discount quality, expiry timing, and deal-to-meal handoffs.' },
  { id: 'basket', label: 'Basket', description: 'Weekly planning, loyalty context, split-shop routing, and replenishment.' },
  { id: 'stores', label: 'Stores + map', description: 'Branch, geography, and cohort features that need store-level evidence.' },
  { id: 'account', label: 'Account workflows', description: 'Features that need identity, consent, saved preferences, or private history.' }
] as const;

export default function FeatureRoadmapPage() {
  return (
    <PageShell>
      <Eyebrow>Product architecture</Eyebrow>
      <h1 className="mt-3 max-w-5xl text-5xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 md:text-7xl">
        A frontend place for every worked-out feature
      </h1>
      <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-slate-700">
        This map keeps GroceryView from becoming a pile of disconnected tools. Each planned capability is assigned to the page where it helps the shopper make a decision, and anything missing real data remains labelled before launch.
      </p>

      <div className="mt-8">
        <FeaturePlacementMap />
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        {clusters.map((cluster) => {
          const count = featurePlacementRoadmap.filter((item) => item.pageCluster === cluster.id).length;
          return (
            <Card className="p-4" key={cluster.id}>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{count} placements</p>
              <h2 className="mt-2 text-xl font-black tracking-tight text-slate-950">{cluster.label}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{cluster.description}</p>
            </Card>
          );
        })}
      </div>

      <Card className="mt-8 border-slate-900 bg-slate-950 text-white">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-lime-200">Implementation rule</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-white">Do not sell or render claims before evidence exists</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-slate-300">
              The roadmap can show intent, IA, and locked states. Product, price, loyalty, nutrition, and account surfaces remain unavailable until the matching source rows, entitlements, and consent records are live.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {featurePlacementRoadmap.map((item) => (
              <Link className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.1]" href={item.targetRoute} key={item.feature}>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-200">{item.status}</p>
                <h3 className="mt-2 text-lg font-black text-white">{item.feature}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">{item.reason}</p>
              </Link>
            ))}
          </div>
        </div>
      </Card>
    </PageShell>
  );
}
