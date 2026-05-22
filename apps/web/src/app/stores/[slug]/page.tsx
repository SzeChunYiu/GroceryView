import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { osmStores } from '@/lib/osm-stores';
import { findStore } from '@/lib/verified-data';
import { metadataForStore } from '@/lib/seo';

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = findStore(slug);
  if (!store) notFound();
  return metadataForStore(store);
}

export function generateStaticParams() {
  return osmStores.slice(0, 80).map((store) => ({ slug: store.slug }));
}

export default async function StorePage({ params }: Readonly<{ params: Promise<{ slug: string }> }>) {
  const { slug } = await params;
  const store = findStore(slug);
  if (!store) notFound();

  return (
    <PageShell>
      <Eyebrow>OSM store record</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{store.name}</h1>
      <p className="mt-3 text-lg text-slate-700">
        {store.brand} · {store.format}
      </p>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-2xl font-black">Location fields</h2>
          <dl className="mt-4 grid gap-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-black">Address</dt>
              <dd>{store.address || 'Not reported by OSM'}</dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-black">City / district</dt>
              <dd>
                {store.city || 'Not reported'} / {store.district || 'Not reported'}
              </dd>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <dt className="font-black">Coordinates</dt>
              <dd>
                {store.lat}, {store.lng}
              </dd>
            </div>
          </dl>
        </Card>
        <Card className="border-amber-200 bg-amber-50">
          <h2 className="text-2xl font-black text-amber-950">Price guardrail</h2>
          <p className="mt-4 leading-7 text-amber-950">
            This store page does not list branch-specific prices because the current verified store source is OSM location data only.
            Chain catalogue prices remain on product and comparison pages.
          </p>
          <p className="mt-4 text-sm font-black text-amber-900">
            Category coverage is grouped by verified shelf rows before any store page merchandising uses it.
          </p>
          <p className="mt-4 text-sm font-black text-amber-900">
            Source: {store.source}; retrieved {store.retrievedDate}.
          </p>
        </Card>
      </div>
    </PageShell>
  );
}
