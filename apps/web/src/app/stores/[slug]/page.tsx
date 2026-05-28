import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ConfidenceBadge } from '@/components/confidence-badge';
import { Card, PageShell, SourceCitation } from '@/components/data-ui';
import { PageQuestionHeader } from '@/components/mvp/handoff-content';
import { ChartShell, ChartTableFallback, DistributionBand } from '@/components/mvp/visual-intelligence';
import { StoreMap } from '@/components/StoreMap';
import { osmStores } from '@/lib/osm-stores';
import {
  adaptiveProductCards,
  findStore,
  storeAssortmentOverviewForStore,
  storeOpeningHoursLabel,
  storePricePercentileRankForStore,
  storePricePercentileRanks,
  storeUniverse
} from '@/lib/verified-data';
import { storePageViewScript } from '@/lib/analytics';
import { metadataForStore } from '@/lib/seo';
import { substitutionPlansForUnavailableProducts } from '@/lib/substitutions';

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

function StoreDetailEmptyState() {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
      <span aria-hidden="true" className="text-3xl">
        🛒
      </span>
      <h3 className="mt-2 text-lg font-black text-slate-950">No branch products or deals yet</h3>
      <p className="mt-1 text-sm font-semibold text-slate-700">
        Check product and comparison pages for chain-level prices while store coverage fills in.
      </p>
    </div>
  );
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ slug: string }> }>): Promise<Metadata> {
  const { slug } = await params;
  const store = findStore(slug);
  if (!store) notFound();
  const metadata = metadataForStore(store);
  const place = store.city || store.district ? ` in ${[store.district, store.city].filter(Boolean).join(', ')}` : '';
  const title = `${store.name} store record | GroceryView`;
  const description = `Verified OpenStreetMap grocery store record for ${store.name}, ${store.brand}${place}. Prices are not inferred from store location.`;

  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      title,
      description,
      images: [
        {
          url: `/stores/${store.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${store.name} ${store.brand}`
        }
      ]
    }
  };
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
  const substitutionPlans = substitutionPlansForUnavailableProducts(adaptiveProductCards).slice(0, 3);
  const storeViewAnalyticsScript = storePageViewScript({
    brand: store.brand,
    storeName: store.name,
    storeSlug: store.slug
  });
  const maxCategoryCoverage = Math.max(1, ...assortmentOverview.categories.map((category) => category.itemCount));
  const storeEvidenceFallbackRows = [
    {
      signal: 'Map pin',
      value: `${store.lat}, ${store.lng}`,
      evidence: `Verified OSM coordinates from ${store.source}`
    },
    {
      signal: 'Opening hours',
      value: openingHoursLabel,
      evidence: 'Shown only when source reports hours; missing hours stay explicit'
    },
    {
      signal: 'Category coverage bars',
      value: assortmentOverview.statusLabel,
      evidence: assortmentOverview.sourceLabel
    },
    {
      signal: 'Price percentile gate',
      value: pricePercentileRank.statusLabel,
      evidence: pricePercentileRank.coverageLabel
    }
  ];

  return (
    <PageShell>
      <script dangerouslySetInnerHTML={{ __html: storeViewAnalyticsScript }} />
      <PageQuestionHeader
        eyebrow="OSM store record"
        question="Is this store good for the products I need?"
        title={store.name}
        subtitle={`See store details, price level, best deals, product coverage, and data freshness. ${store.brand} · ${store.format}`}
        actions={
          <>
            <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`/search?store=${encodeURIComponent(store.slug)}`}>
              Search products in this store
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/deals?store=${encodeURIComponent(store.slug)}`}>
              Deals at this store
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/map?store=${encodeURIComponent(store.slug)}`}>
              Open map
            </Link>
          </>
        }
      />
      <div className="mt-4">
        <SourceCitation
          confidenceLabel={`${pricePercentileRank.confidenceLabel} · ${pricePercentileRank.coverageLabel}`}
          connectorRun={`storeUniverse OSM snapshot · ${assortmentOverview.statusLabel}`}
          href="/data-sources"
          observedAt={store.retrievedDate}
          sourceLabel={`${store.source} · ${openingHoursLabel}`}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`/search?store=${encodeURIComponent(store.slug)}`}>
          Search products in this store
        </Link>
        <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/deals?store=${encodeURIComponent(store.slug)}`}>
          Deals at this store
        </Link>
        <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/map?store=${encodeURIComponent(store.slug)}`}>
          Open map
        </Link>
      </div>
      <div className="mt-6">
        <ChartShell
          actionHref={`/map?store=${encodeURIComponent(store.slug)}`}
          actionLabel="Open map"
          evidenceItems={[
            `Map pin ${store.lat}, ${store.lng}`,
            `Opening hours: ${openingHoursLabel}`,
            `${assortmentOverview.categories.length} category coverage bars`,
            `Price percentile gate: ${pricePercentileRank.confidenceLabel}`
          ]}
          insightTitle="Store visual evidence board"
          plainSummary="This store visual groups the verified map pin, opening-hours state, category coverage bars, and price-percentile gate so shoppers can see what is source-backed before browsing products."
          userQuestion="Can I trust this store page for location, hours, coverage, and price rank?"
          fallback={
            <ChartTableFallback
              caption="Store evidence board fallback"
              columns={[
                { key: 'signal', label: 'Signal', render: (row: (typeof storeEvidenceFallbackRows)[number]) => row.signal },
                { key: 'value', label: 'Value', render: (row: (typeof storeEvidenceFallbackRows)[number]) => row.value },
                { key: 'evidence', label: 'Evidence', render: (row: (typeof storeEvidenceFallbackRows)[number]) => row.evidence }
              ]}
              rows={storeEvidenceFallbackRows}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Map pin</p>
              <p className="mt-2 text-2xl font-black text-slate-950">{store.name}</p>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-700">
                {store.address || 'Address not reported by OSM'} · {store.lat}, {store.lng}
              </p>
              <p className="mt-3 rounded-2xl bg-white/85 p-3 text-sm font-black text-emerald-950">Opening hours: {openingHoursLabel}</p>
            </div>
            <div className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Category coverage bars</p>
              {assortmentOverview.categories.length > 0 ? (
                <div className="mt-3 grid gap-3">
                  {assortmentOverview.categories.slice(0, 4).map((category) => (
                    <div key={category.category}>
                      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-slate-600">
                        <span>{category.category}</span>
                        <span>{category.itemCount.toLocaleString('sv-SE')} items</span>
                      </div>
                      <DistributionBand current={category.itemCount} label={`${category.category} store category coverage`} max={maxCategoryCoverage} min={0} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-black text-amber-950">
                  No branch-specific category coverage bars are rendered until verified assortment rows match this store.
                </p>
              )}
            </div>
            <div className="rounded-3xl border border-cyan-100 bg-cyan-50/70 p-4 lg:col-span-2">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-800">Price percentile gate</p>
              <p className="mt-2 text-2xl font-black text-cyan-950">{pricePercentileRank.statusLabel}</p>
              {pricePercentileRank.isRanked && pricePercentileRank.nationalPricePercentile !== null ? (
                <DistributionBand current={pricePercentileRank.nationalPricePercentile} label={`${store.name} national price percentile`} max={100} min={0} />
              ) : (
                <p className="mt-3 rounded-2xl bg-white/85 p-3 text-sm font-bold leading-6 text-cyan-950">
                  {pricePercentileRank.detail}
                </p>
              )}
            </div>
          </div>
        </ChartShell>
      </div>
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
        <Card className="lg:col-span-2">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Google Maps store pin</p>
          <h2 className="mt-2 text-2xl font-black">Location map and directions</h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Embedded Google Maps uses the verified OSM latitude/longitude for this store and links out to turn-by-turn directions.
          </p>
          <div className="mt-4">
            <StoreMap store={{ name: store.name, address: store.address, lat: store.lat, lng: store.lng }} />
          </div>
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
          <div className="mt-4 flex flex-wrap gap-2">
            <Link className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" href={`/search?store=${encodeURIComponent(store.slug)}`}>
              Search products at this store
            </Link>
            <Link className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-black text-emerald-900" href={`/deals?store=${encodeURIComponent(store.slug)}`}>
              Deals at this store
            </Link>
          </div>
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
                <Link className="rounded-2xl border border-slate-200 p-4 transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200" href={`/products/${encodeURIComponent(item.id)}`} key={item.id}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{item.category}</p>
                  <p className="mt-1 font-black">{item.name}</p>
                  <p className="mt-1 text-sm font-bold text-slate-700">
                    {item.priceLabel} · {item.unitPriceLabel} · {item.packageLabel}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-500">{item.validWindow}</p>
                </Link>
              ))}
            </div>
          ) : (
            <StoreDetailEmptyState />
          )}
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
        <Card className="border-emerald-200 bg-emerald-50">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-800">Selected-store substitutions</p>
          <h2 className="mt-2 text-2xl font-black text-emerald-950">Alternatives when an item is unavailable</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-emerald-950">
            Store pages use the same substitutionSuggestionsForUnavailableProduct scorer as product cards: same category first, then brand preference, price, and nutrition/safety evidence.
          </p>
          {substitutionPlans.length > 0 ? (
            <div className="mt-4 grid gap-3">
              {substitutionPlans.map((plan) => (
                <div className="rounded-2xl border border-emerald-200 bg-white p-4" key={plan.unavailableProduct.slug}>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Unavailable: {plan.unavailableProduct.name}</p>
                  <ul className="mt-2 space-y-2">
                    {plan.suggestions.map((suggestion) => (
                      <li className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-950" key={suggestion.slug}>
                        <Link className="block underline decoration-emerald-300 underline-offset-4" href={`/products/${encodeURIComponent(suggestion.slug)}`}>
                        <span className="block font-black">{suggestion.name} · {suggestion.totalPriceLabel}</span>
                        {suggestion.reason} · {suggestion.nutritionImpactLabel}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-bold text-emerald-950">
              No verified latest-price row currently marks a product unavailable for this selected store, so alternatives stay hidden instead of being fabricated.
            </p>
          )}
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
