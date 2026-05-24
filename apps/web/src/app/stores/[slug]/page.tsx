import { notFound } from 'next/navigation';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { osmStores } from '@/lib/osm-stores';
import {
  findStore,
  storeAssortmentOverviewForStore,
  storeOpeningHoursLabel,
  storePricePercentileRankForStore,
  storePricePercentileRanks,
  storeUniverse
} from '@/lib/verified-data';
import { storePageViewScript } from '@/lib/analytics';
import { metadataForStore } from '@/lib/seo';

type ConfidenceLevel = 'high' | 'medium' | 'low';

function cohortKeyFor(store: (typeof storeUniverse)[number]) {
  return store.city || store.district || 'kommun not reported';
}

function confidenceLevelForRank(matchedRank: NonNullable<ReturnType<typeof storePricePercentileRankForStore>>): ConfidenceLevel {
  return matchedRank.matchedPerBranchObservationCount >= 30 && matchedRank.regularPriceObservationCount >= 12 ? 'high' : 'medium';
}

function storePricePercentileRankFor(store: (typeof storeUniverse)[number]) {
  const matchedRank = storePricePercentileRankForStore(store.slug);
  if (matchedRank) {
    return {
      title: 'store price-percentile rank',
      subtitle: 'your store vs everyone',
      statusLabel: matchedRank.statusLabel,
      isRanked: true,
      nationalPricePercentile: matchedRank.nationalPricePercentile,
      nationalPricePercentileLabel: matchedRank.nationalPricePercentileLabel,
      kommunPricePercentile: matchedRank.kommunPricePercentile,
      kommunPricePercentileLabel: matchedRank.kommunPricePercentileLabel,
      cheaperThanNationalLabel: matchedRank.cheaperThanNationalLabel,
      cheaperThanKommunLabel: matchedRank.cheaperThanKommunLabel,
      averageRelativeIndexLabel: matchedRank.averageRelativeIndexLabel,
      coverageLabel: matchedRank.coverageLabel,
      confidenceLabel: matchedRank.confidenceLabel,
      matchedPerBranchObservationCount: matchedRank.matchedPerBranchObservationCount,
      confidenceLevel: confidenceLevelForRank(matchedRank),
      detail:
        `Ranked from ${matchedRank.matchedPerBranchObservationCount.toLocaleString('sv-SE')} per-branch Lidl offer observations matched to ${matchedRank.externalStoreId}. Lower index means the branch has deeper public offer prices versus regular-price baselines.`,
      cohorts: [
        {
          label: 'kommun cohort',
          value: matchedRank.kommun,
          storeCount: matchedRank.kommunCohortSize,
          detail: `Kommun derived from ${matchedRank.kommunDerivedFrom}; price percentile ${matchedRank.kommunPricePercentileLabel}, cheaper than ${matchedRank.cheaperThanKommunLabel} of matched Lidl branches in the cohort.`
        },
        {
          label: 'national cohort',
          value: 'Sweden',
          storeCount: matchedRank.nationalCohortSize,
          detail: `National price percentile ${matchedRank.nationalPricePercentileLabel}, cheaper than ${matchedRank.cheaperThanNationalLabel} of matched Lidl branches.`
        }
      ],
      requiredEvidence: [
        'per-branch Lidl offer observations with regular-price baselines',
        'an OSM store match to a Lidl external store id before rendering a percentile',
        'confidence/coverage labels beside every percentile badge'
      ]
    };
  }

  const kommunCohortKey = cohortKeyFor(store);
  const kommunStores = storeUniverse.filter((candidate) => cohortKeyFor(candidate) === kommunCohortKey);
  const sameBrandStores = storeUniverse.filter((candidate) => candidate.brand === store.brand);
  const confidenceLevel: ConfidenceLevel = 'low';

  return {
    title: 'store price-percentile rank',
    subtitle: 'your store vs everyone',
    statusLabel: 'Not enough per-branch observations',
    isRanked: false,
    nationalPricePercentile: null,
    nationalPricePercentileLabel: 'Not reported',
    kommunPricePercentile: null,
    kommunPricePercentileLabel: 'Not reported',
    cheaperThanNationalLabel: 'Not reported',
    cheaperThanKommunLabel: 'Not reported',
    averageRelativeIndexLabel: 'Not reported',
    coverageLabel: `${storePricePercentileRanks.length.toLocaleString('sv-SE')} matched Lidl stores have per-branch offer ranks; this OSM record is not matched.`,
    confidenceLabel: 'coverage blocker',
    confidenceLevel,
    matchedPerBranchObservationCount: 0,
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
  const openingHoursLabel = storeOpeningHoursLabel(store);
  const assortmentOverview = storeAssortmentOverviewForStore(store);
  const storeViewAnalyticsScript = storePageViewScript({
    brand: store.brand,
    storeName: store.name,
    storeSlug: store.slug
  });

  return (
    <PageShell>
      <script dangerouslySetInnerHTML={{ __html: storeViewAnalyticsScript }} />
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
        <Card>
          <h2 className="text-2xl font-black">Opening hours</h2>
          <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-lg font-black text-slate-900">{openingHoursLabel}</p>
          <p className="mt-4 text-sm leading-6 text-slate-700">
            Hours are shown only when the store source reports them. Missing hours stay explicit instead of being inferred from
            chain defaults.
          </p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Store detail assortment</p>
          <h2 className="mt-2 text-2xl font-black">Assortment overview</h2>
          <p className="mt-3 rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-800">
            {assortmentOverview.statusLabel}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-700">{assortmentOverview.sourceLabel}</p>
          {assortmentOverview.categories.length > 0 ? (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {assortmentOverview.categories.map((category) => (
                <div className="rounded-2xl border border-slate-200 p-4" key={category.category}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{category.category}</p>
                  <p className="mt-1 text-xl font-black">{category.itemCount.toLocaleString('sv-SE')} items</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-950">
              No branch-specific assortment rows are matched for this OSM store yet.
            </p>
          )}
          {assortmentOverview.items.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {assortmentOverview.items.slice(0, 24).map((item) => (
                <div className="rounded-2xl border border-slate-200 p-4" key={item.id}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
                  <p className="mt-1 font-black">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {item.priceLabel} · {item.unitPriceLabel} · {item.packageLabel}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.validWindow}</p>
                </div>
              ))}
            </div>
          ) : null}
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {assortmentOverview.guardrails.map((guardrail) => (
              <li key={guardrail}>{guardrail}</li>
            ))}
          </ul>
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
          <div className="mt-4">
            <ConfidenceBadge
              level={pricePercentileRank.confidenceLevel}
              label={pricePercentileRank.confidenceLabel}
              sampleSize={pricePercentileRank.matchedPerBranchObservationCount}
            />
          </div>
          <p className="mt-4 leading-7 text-cyan-950">{pricePercentileRank.detail}</p>
          {pricePercentileRank.isRanked ? (
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">nationalPricePercentile</p>
                <p className="mt-2 text-2xl font-black text-cyan-950">{pricePercentileRank.nationalPricePercentileLabel}</p>
                <p className="mt-1 text-sm font-bold text-cyan-900">cheaper than {pricePercentileRank.cheaperThanNationalLabel} nationally</p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">kommunPricePercentile</p>
                <p className="mt-2 text-2xl font-black text-cyan-950">{pricePercentileRank.kommunPricePercentileLabel}</p>
                <p className="mt-1 text-sm font-bold text-cyan-900">cheaper than {pricePercentileRank.cheaperThanKommunLabel} in kommun</p>
              </div>
              <div className="rounded-2xl border border-cyan-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">confidence/coverage</p>
                <p className="mt-2 text-lg font-black text-cyan-950">{pricePercentileRank.confidenceLabel}</p>
                <p className="mt-1 text-sm font-bold text-cyan-900">{pricePercentileRank.coverageLabel}</p>
              </div>
            </div>
          ) : null}
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
