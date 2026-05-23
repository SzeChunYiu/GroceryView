import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { IcaStoreMap } from '@/components/ica-store-map';
import { icaStoreCount, icaStoresSource } from '@/lib/ingested/ica-stores';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/stores/ica');
}

export default function IcaStoresPage() {
  return (
    <PageShell>
      <Eyebrow>Stores / ICA</Eyebrow>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="mt-2 text-4xl font-black tracking-tight">ICA store locator</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
            Real ICA branch locations from OpenStreetMap Overpass, filtered to Swedish supermarket rows with coordinates.
          </p>
        </div>
        <Card className="lg:w-80">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Coverage</p>
          <p className="mt-2 text-3xl font-black">{icaStoreCount.toLocaleString()} stores</p>
          <p className="mt-2 text-sm text-slate-600">Source: {icaStoresSource.source}</p>
        </Card>
      </div>
      <IcaStoreMap />
    </PageShell>
  );
}
