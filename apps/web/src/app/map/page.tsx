import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { storeUniverse } from '@/lib/verified-data';

export default function MapPage() {
  const visibleStores = storeUniverse.slice(0, 80);
  return (
    <PageShell>
      <Eyebrow>Map data</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Store coordinates without invented travel scoring</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">The website has verified latitude and longitude for OSM stores. It does not invent route times, store quality scores, or branch-level prices.</p>
      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleStores.map((store) => <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={store.slug}><p className="font-black">{store.name}</p><p className="text-sm text-slate-600">{store.lat.toFixed(5)}, {store.lng.toFixed(5)}</p><p className="text-sm text-slate-600">{store.brand}</p></div>)}
        </div>
      </Card>
    </PageShell>
  );
}
