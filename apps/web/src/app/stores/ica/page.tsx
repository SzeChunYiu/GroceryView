import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { IcaStoreMap } from '@/components/ica-store-map';
import { icaLocatorStores } from '@/lib/ica-locator-stores';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/stores/ica');
}

export default function IcaStoresPage() {
  const cityCount = new Set(icaLocatorStores.map((store) => store.city || store.district).filter(Boolean)).size;

  return (
    <PageShell>
      <Eyebrow>ICA chain locator</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">ICA store locator map</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Browse verified ICA and Maxi ICA location rows from OpenStreetMap. The map is intentionally a runtime locator surface only: it does not invent branch shelf prices, stock status, or basket totals from coordinates.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">ICA rows</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{icaLocatorStores.length.toLocaleString('sv-SE')}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">OSM stores matched by ICA or Maxi brand/name.</p>
        </Card>
        <Card>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Cities / districts</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{cityCount.toLocaleString('sv-SE')}</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">Coverage is a locator signal, not a price-confidence signal.</p>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-800">Guardrail</p>
          <p className="mt-2 text-sm font-bold leading-6 text-amber-950">No data changes, inferred prices, stock claims, or loyalty availability are introduced by this locator.</p>
        </Card>
      </div>
      <div className="mt-8 h-[44rem]">
        <IcaStoreMap />
      </div>
    </PageShell>
  );
}
