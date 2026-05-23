import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/stores');
}

export default function StoresIndexPage() {
  const brandCounts = [...storeUniverse.reduce((map, store) => map.set(store.brand, (map.get(store.brand) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1]);
  return (
    <PageShell>
      <Eyebrow>Stores</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Sweden store directory</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">Store rows come from OpenStreetMap. Prices are never inferred from store proximity, brand, or format.</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.7fr_1.3fr]">
        <Card><h2 className="text-2xl font-black">Brand coverage</h2><div className="mt-4 flex flex-wrap gap-2">{brandCounts.slice(0, 18).map(([brand, count]) => <span className="rounded-full bg-slate-100 px-3 py-2 text-sm font-black" key={brand}>{brand}: {count}</span>)}</div></Card>
        <Card><h2 className="text-2xl font-black">Stores with coordinates</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{storeUniverse.slice(0, 60).map((store) => <Link className="rounded-2xl border border-slate-200 p-4 hover:border-emerald-700" href={`/stores/${store.slug}`} key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.brand} · {store.city || store.district || 'City not reported'}</p></Link>)}</div></Card>
      </div>
    </PageShell>
  );
}
