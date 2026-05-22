import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { osmStores } from '@/lib/osm-stores';
import { findStore, storeUniverse } from '@/lib/verified-data';
import { metadataForStore } from '@/lib/seo';

function cohortKeyFor(store: (typeof storeUniverse)[number]) {
  return store.city || store.district || 'kommun not reported';
}

function storePricePercentileRankFor(store: (typeof storeUniverse)[number]) {
  const kommunCohortKey = cohortKeyFor(store);
  const kommunStores = storeUniverse.filter((candidate) => cohortKeyFor(candidate) === kommunCohortKey);
  const sameBrandStores = storeUniverse.filter((candidate) => candidate.brand === store.brand);

  return {
    title: 'store price-percentile rank',
    subtitle: 'your store vs everyone',
    statusLabel: 'Not enough per-branch observations',
    cohorts: [
      {
        label: 'kommun cohort',
        value: kommunCohortKey,
        storeCount: kommunStores.length,
        detail: 'Uses OSM city/district as coverage evidence only until a verified kommun field is derived from coordinates or postcode.'
      },
      {
        label: 'national cohort',
        value: 'Sweden',
        storeCount: storeUniverse.length,
        detail: `${sameBrandStores.length.toLocaleString('sv-SE')} ${store.brand} stores are present in the national OSM directory, but brand coverage is not a price percentile.`
      }
    ],
    requiredEvidence: [
      'per-branch observations for the viewed product, basket, or overall index',
      'a verified kommun field on stores so local and national cohorts are separated cleanly',
      'confidence/coverage thresholds before any percentile badge is shown to shoppers'
    ],
    detail:
      'No percentile is calculated without per-branch observations. The current verified store source is location-only OSM data, so GroceryView withholds the store price-percentile rank instead of fabricating a cheap/dear badge.'
  };
}

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
  const pricePercentileRank = storePricePercentileRankFor(store);

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
        <Card className="border-cyan-200 bg-cyan-50">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800">{pricePercentileRank.title}</p>
          <h2 className="mt-2 text-2xl font-black text-cyan-950">{pricePercentileRank.subtitle}</h2>
          <p className="mt-3 rounded-full bg-white px-3 py-2 text-sm font-black text-cyan-900">
            {pricePercentileRank.statusLabel}
          </p>
          <p className="mt-4 leading-7 text-cyan-950">{pricePercentileRank.detail}</p>
          <div className="mt-4 grid gap-3">
            {pricePercentileRank.cohorts.map((cohort) => (
              <div className="rounded-2xl border border-cyan-200 bg-white p-4" key={cohort.label}>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">{cohort.label}</p>
                <p className="mt-1 text-lg font-black text-cyan-950">
                  {cohort.value} · {cohort.storeCount.toLocaleString('sv-SE')} stores
                </p>
                <p className="mt-2 text-sm leading-6 text-cyan-900">{cohort.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-cyan-200 bg-white p-4">
            <p className="text-sm font-black text-cyan-950">Required confidence/coverage before rank unlocks</p>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-cyan-900">
              {pricePercentileRank.requiredEvidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
