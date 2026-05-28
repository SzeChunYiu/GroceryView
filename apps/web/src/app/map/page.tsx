import { calculateChainPriceIndex } from '@groceryview/core';
import Link from 'next/link';
import { GroceryViewSurfaceAnalytics } from '@/components/analytics/groceryview-surface-analytics';
import { Card, Eyebrow, PageShell, SourceCitation } from '@/components/data-ui';
import { ChartShell, ChartTableFallback, GeoHeatmap } from '@/components/mvp/visual-intelligence';
import { SavedViewActions } from '@/components/saved-view-actions';
import { StoreDistanceCard } from '@/components/StoreDistanceCard';
import { MapNearbyStorePreviews } from '@/components/map/map-nearby-store-previews';
import { StoreMap } from '@/components/store-map';
import { buildChainPriceObservations } from '@/lib/chain-index-data';
import { storeMatchesOperatingHoursFilter, type OperatingHoursFilter } from '@/lib/geolocation';
import { buildFuelSelectedStationDetail } from '@/lib/fuel-domain';
import { buildPharmacySelectedDetail } from '@/lib/pharmacy-domain';
import { basketCostHeatmap } from '@/lib/map-basket-cost-heatmap';
import { buildStoreInventoryConfidence } from '@/lib/osm-stores';
import { formatPct, storePricePercentileRanks, storeUniverse } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';
import { buildNearbyDealRecommendations, buildStoreDistanceCompare } from '@/lib/store-distance';

export function generateMetadata() {
  return routeMetadata('/map');
}

const chainIndexSummary = calculateChainPriceIndex(buildChainPriceObservations());
const chainIndexByBrand = new Map(chainIndexSummary.chains.map((chain) => [chain.chainId.toLowerCase(), chain]));
const cheapestChainNearMe = chainIndexSummary.chains[0];
const cheapestBranchNearMe = storePricePercentileRanks[0] ?? null;
const districtHeatOverlay = buildDistrictHeatOverlay();
const regionalPriceStatisticsGate = buildRegionalPriceStatisticsGate();
const routeAwareNearestStorePlan = buildStoreDistanceCompare(
  'makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st,svensk-honung-101550069-st',
  'walk'
);
const topRouteAwareStores = routeAwareNearestStorePlan.rows.slice(0, 4);
const nearbyDealRecommendations = buildNearbyDealRecommendations();
const routeSavingsBenchmarkSek = Math.max(...topRouteAwareStores.map((store) => store.basketTotalSek));
const topRouteSavingsHints = topRouteAwareStores.map((store) => ({
  ...store,
  expectedBasketSavingsSek: Number((routeSavingsBenchmarkSek - store.basketTotalSek).toFixed(2))
}));
const topRouteAwareStoreInventory = topRouteSavingsHints.map((store) => {
  const osmStore = osmStoreForRouteStore(store);
  return osmStore ? buildStoreInventoryConfidence(osmStore) : null;
});
const mapLayerOptions = [
  { key: 'stores', label: 'Store locations · grocery store locations', detail: 'OSM store pins with chain-index proxy colors.' },
  { key: 'price-index', label: 'Price index · grocery price index', detail: 'Chain-index proxy by visible store brand and district.' },
  { key: 'category-index', label: 'Category index', detail: 'Category filter context routed into browse and search.' },
  { key: 'deal-density', label: 'Deal density', detail: 'Nearby deal candidates around visible map stores.' },
  { key: 'freshness', label: 'Freshness · data freshness', detail: 'Source freshness and OSM hours metadata only.' },
  { key: 'coverage', label: 'Coverage · coverage', detail: 'OSM and chain-index coverage by area.' },
  { key: 'pharmacy-locations', label: 'Pharmacy locations · pharmacy locations', detail: 'Pharmacy/source coverage route context; no prescription or stock claims.' },
  { key: 'pharmacy-otc-coverage', label: 'pharmacy OTC coverage', detail: 'Public OTC catalog row counts and source freshness, not inventory.' },
  { key: 'fuel-stations', label: 'Fuel stations · fuel stations', detail: 'Fuel station locations and grade availability only; no station pump price inference.' },
  { key: 'fuel-grade-availability', label: 'fuel grade availability', detail: 'Tagged station grade support plus operator-level price evidence guardrails.' }
];
const mapSelectedDetailStates = [
  { state: 'store', detail: 'If store selected: show store summary, chain-index proxy, source timestamp, and open-store action.' },
  { state: 'kommun', detail: 'If kommun selected: show price/coverage summary, confidence blockers, and open market/map action.' },
  { state: 'fuel station', detail: 'If fuel station selected: show station evidence, grade availability, and the operator-level price guardrail.' },
  { state: 'pharmacy', detail: 'If pharmacy selected: show pharmacy/source coverage with OTC safety boundaries only.' }
];
const mapDomainRoutes = [
  { domain: 'grocery', href: '/map?domain=grocery', label: 'Grocery map' },
  { domain: 'pharmacy', href: '/map?domain=pharmacy', label: 'Pharmacy map' },
  { domain: 'fuel', href: '/map?domain=fuel', label: 'Fuel map' }
];
const operatingHoursFilters: Array<{ href: string; id: OperatingHoursFilter | null; label: string; detail: string }> = [
  { href: '/map', id: null, label: 'All stores', detail: 'Show every mapped store in the OSM extract.' },
  { href: '/map?hours=open-now', id: 'open-now', label: 'Open now', detail: 'Map only stores whose OSM hours match the current local time.' },
  { href: '/map?hours=open-evening', id: 'open-evening', label: 'Open this evening', detail: 'Map stores open around 18:00 or 20:00 today.' },
  { href: '/map?hours=open-24h', id: 'open-24h', label: '24h', detail: 'Map stores labelled 24/7 or 00:00-24:00.' }
];

function slugifyRouteValue(value: string) {
  return value.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function parseOperatingHoursFilter(value: string | string[] | undefined): OperatingHoursFilter | null {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw === 'open-now' || raw === 'open-evening' || raw === 'open-24h' ? raw : null;
}

function normaliseBrand(brand: string) {
  const lower = brand.toLowerCase();
  if (lower.includes('ica')) return 'ica';
  if (lower.includes('coop')) return 'coop';
  if (lower.includes('willys')) return 'willys';
  if (lower.includes('hemköp') || lower.includes('hemkop')) return 'hemköp';
  if (lower.includes('lidl')) return 'lidl';
  if (lower.includes('city gross')) return 'city gross';
  if (lower.includes('tempo')) return 'tempo';
  return lower;
}

function osmStoreForRouteStore(store: { areaLabel: string; chainName: string; storeName: string }) {
  const brand = normaliseBrand(store.chainName);
  const area = store.areaLabel.toLowerCase();
  return storeUniverse.find((candidate) =>
    normaliseBrand(candidate.brand) === brand &&
    `${candidate.name} ${candidate.address} ${candidate.city} ${candidate.district}`.toLowerCase().includes(area)
  ) ?? storeUniverse.find((candidate) => normaliseBrand(candidate.brand) === brand) ?? null;
}

function inventoryTone(level: 'high' | 'medium' | 'low') {
  if (level === 'high') return 'bg-emerald-50 text-emerald-950';
  if (level === 'medium') return 'bg-amber-50 text-amber-950';
  return 'bg-rose-50 text-rose-950';
}

function markerTone(index?: number) {
  if (index === undefined) return 'border-slate-200 bg-slate-50 text-slate-700';
  if (index < 96) return 'border-emerald-300 bg-emerald-50 text-emerald-950';
  if (index > 104) return 'border-rose-300 bg-rose-50 text-rose-950';
  return 'border-amber-300 bg-amber-50 text-amber-950';
}

function heatTone(index: number) {
  if (index < 96) return 'bg-emerald-100 text-emerald-950';
  if (index > 104) return 'bg-rose-100 text-rose-950';
  return 'bg-amber-100 text-amber-950';
}

function basketHeatTone(tone: string) {
  if (tone === 'cool') return 'border-emerald-200 bg-emerald-50 text-emerald-950';
  if (tone === 'hot') return 'border-rose-200 bg-rose-50 text-rose-950';
  return 'border-amber-200 bg-amber-50 text-amber-950';
}

function buildDistrictHeatOverlay() {
  const districts = new Map<string, { totalStores: number; coveredStores: number; indexTotal: number; chains: Set<string> }>();
  for (const store of storeUniverse) {
    const district = store.district || store.city || 'Unknown district';
    const current = districts.get(district) ?? { totalStores: 0, coveredStores: 0, indexTotal: 0, chains: new Set<string>() };
    current.totalStores += 1;
    const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
    if (chain) {
      current.coveredStores += 1;
      current.indexTotal += chain.overallIndex;
      current.chains.add(chain.chainId);
    }
    districts.set(district, current);
  }

  return [...districts.entries()]
    .map(([district, row]) => ({
      district,
      totalStores: row.totalStores,
      coveredStores: row.coveredStores,
      averageIndex: row.coveredStores > 0 ? row.indexTotal / row.coveredStores : 100,
      chainCount: row.chains.size,
      coverageShare: row.totalStores > 0 ? row.coveredStores / row.totalStores : 0
    }))
    .filter((row) => row.coveredStores > 0)
    .sort((a, b) => a.averageIndex - b.averageIndex || b.coveredStores - a.coveredStores)
    .slice(0, 12);
}

function buildRegionalCoverageRows(scope: 'city' | 'district') {
  const cohorts = new Map<string, { totalStores: number; coveredStores: number; chains: Set<string> }>();
  for (const store of storeUniverse) {
    const label = scope === 'city' ? store.city || 'City not reported' : store.district || store.city || 'District not reported';
    const current = cohorts.get(label) ?? { totalStores: 0, coveredStores: 0, chains: new Set<string>() };
    current.totalStores += 1;
    const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
    if (chain) {
      current.coveredStores += 1;
      current.chains.add(chain.chainId);
    }
    cohorts.set(label, current);
  }

  return [...cohorts.entries()]
    .map(([label, row]) => ({
      label,
      totalStores: row.totalStores,
      coveredStores: row.coveredStores,
      chainCount: row.chains.size,
      coverageShare: row.totalStores > 0 ? row.coveredStores / row.totalStores : 0,
      statisticLabel: 'Not calculated',
      detail: 'Coverage-only row: OSM locations and chain-index availability are visible, but no per-branch observations are attached to this region.'
    }))
    .sort((a, b) => b.coveredStores - a.coveredStores || b.totalStores - a.totalStores || a.label.localeCompare(b.label, 'sv'))
    .slice(0, 6);
}

function buildRegionalPriceStatisticsGate() {
  const cityPriceStatisticRows = buildRegionalCoverageRows('city');
  const districtPriceStatisticRows = buildRegionalCoverageRows('district');

  return {
    title: 'Regional / district / city price statistics',
    statusLabel: 'Not enough per-branch observations',
    cityPriceStatisticRows,
    districtPriceStatisticRows,
    requiredEvidence: [
      'per-branch observations for products or baskets inside each city, district, and kommun cohort',
      'stable city/district/kommun mapping for every store row before regional statistics are compared',
      'confidence/coverage thresholds that block sparse cohorts instead of ranking them as cheap or expensive'
    ],
    detail:
      'No regional price statistic is calculated without per-branch observations. The map can show OSM coverage and chain-index proxies today, but city, district, and kommun price statistics stay withheld until branch-level price tape exists.'
  };
}

export default async function MapPage({ searchParams }: Readonly<{ searchParams?: Promise<Record<string, string | string[] | undefined>> }>) {
  const params = await (searchParams ?? Promise.resolve<Record<string, string | string[] | undefined>>({}));
  const selectedHoursFilter = parseOperatingHoursFilter(params.hours);
  const selectedDomain = Array.isArray(params.domain) ? params.domain[0] ?? 'grocery' : params.domain ?? 'grocery';
  const selectedFuelStation = buildFuelSelectedStationDetail(params.station);
  const selectedPharmacy = buildPharmacySelectedDetail(params.pharmacy);
  const selectedLayer = selectedDomain === 'fuel' ? 'fuel-stations' : selectedDomain === 'pharmacy' ? 'pharmacy-locations' : Array.isArray(params.layer) ? params.layer[0] ?? 'stores' : params.layer ?? 'stores';
  const selectedCategory = Array.isArray(params.category) ? params.category[0] ?? 'all' : params.category ?? 'all';
  const selectedChain = Array.isArray(params.chain) ? params.chain[0] ?? 'all' : params.chain ?? 'all';
  const selectedRegion = Array.isArray(params.region) ? params.region[0] ?? 'stockholm' : params.region ?? 'stockholm';
  const selectedConfidence = Array.isArray(params.confidence) ? params.confidence[0] ?? 'all' : params.confidence ?? 'all';
  const filteredStores = storeUniverse.filter((store) => storeMatchesOperatingHoursFilter(store, selectedHoursFilter));
  const visibleStores = filteredStores.slice(0, 80);
  const mapFallbackRows = visibleStores.slice(0, 8).map((store) => ({
    marker: store.name,
    type: 'Store locations',
    region: store.district || store.city || selectedRegion,
    layer: selectedLayer,
    evidence: store.retrievedDate ? `OSM ${store.retrievedDate}` : 'OSM source'
  }));
  const mapGeoCells = districtHeatOverlay.slice(0, 6).map((district) => ({
    row: district.district,
    column: selectedLayer,
    valueLabel: `${district.averageIndex.toFixed(1)} index`,
    tone: district.averageIndex < 96 ? 'low' as const : district.averageIndex > 104 ? 'high' as const : 'medium' as const,
    href: `/map?region=${encodeURIComponent(slugifyRouteValue(district.district))}&layer=price-index`,
    signal: `${district.coveredStores} covered stores`
  }));

  return (
    <PageShell data-gv-surface="map">
      <GroceryViewSurfaceAnalytics surface="map" />
      <Eyebrow>Map data</Eyebrow>
      <p className="mt-3 text-sm font-black text-emerald-900">Where are grocery prices cheaper or more expensive?</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Grocery price map</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Explore stores, price index heatmaps, category price differences, and data freshness by area. Markers are colored by chain-level price evidence only; branch-level prices, route times, and store quality scores are not invented.
      </p>
      <div className="mt-4">
        <SourceCitation
          confidenceLabel={`${visibleStores.length} visible OSM stores; marker prices use chain-index proxy only`}
          connectorRun="storeUniverse OSM snapshot + calculateChainPriceIndex proxy"
          href="/data-sources"
          observedAt={visibleStores[0]?.retrievedDate}
          sourceLabel="OpenStreetMap store coordinates with verified chain-index overlay"
        />
      </div>
      <section className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Map domain routes">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Map domain routes</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {mapDomainRoutes.map((route) => (
            <Link
              className={selectedDomain === route.domain ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-800'}
              href={route.href}
              key={route.domain}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </section>

      <div className="mt-6">
        <ChartShell
          actionHref={`/map?region=${encodeURIComponent(selectedRegion)}&layer=${encodeURIComponent(selectedLayer)}`}
          actionLabel="Open selected map view"
          evidenceItems={[
            `${visibleStores.length} visible markers`,
            `Domain ${selectedDomain}`,
            `Layer ${selectedLayer}`,
            'Always visible legend'
          ]}
          fallback={
            <ChartTableFallback
              caption="Table/list of visible markers"
              columns={[
                { key: 'marker', label: 'Marker', render: (row) => row.marker },
                { key: 'type', label: 'Layer', render: (row) => row.type },
                { key: 'region', label: 'Region', render: (row) => row.region },
                { key: 'evidence', label: 'Evidence', render: (row) => row.evidence }
              ]}
              rows={mapFallbackRows}
            />
          }
          hasData={visibleStores.length > 0}
          insightTitle="Map visual command center"
          plainSummary="Left layer controls, main map context, right selected detail rules, and bottom Table/list of visible markers stay route-driven and source-backed."
          userQuestion="Where can I compare mapped grocery, pharmacy, and fuel evidence?"
        >
          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">Always visible legend</p>
              <div className="mt-3 grid gap-2">
                {mapLayerOptions.map((layer) => (
                  <Link
                    className="rounded-2xl bg-white p-3 text-sm font-bold text-emerald-950 shadow-sm"
                    href={layer.key.startsWith('fuel-') ? `/map?domain=fuel&layer=${encodeURIComponent(layer.key)}` : layer.key.startsWith('pharmacy-') ? `/map?domain=pharmacy&layer=${encodeURIComponent(layer.key)}` : `/map?domain=grocery&layer=${encodeURIComponent(layer.key)}&region=${encodeURIComponent(selectedRegion)}`}
                    key={layer.key}
                  >
                    <span className="block font-black">{layer.label}</span>
                    <span className="mt-1 block text-xs font-semibold text-slate-600">{layer.detail}</span>
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid gap-4">
              <GeoHeatmap cells={mapGeoCells} />
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Selected detail panel rules</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {mapSelectedDetailStates.map((state) => (
                    <p className="rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700" key={state.state}>
                      <span className="block font-black text-slate-950">{state.state}</span>
                      {state.detail}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </ChartShell>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[18rem_1fr_20rem]">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Map layers</p>
          <h2 className="mt-2 text-2xl font-black">Choose the signal</h2>
          <form className="mt-4 grid gap-3 text-sm font-semibold leading-6 text-slate-700">
            {[
              { key: 'layer', label: 'Layer selector', value: selectedLayer, options: mapLayerOptions.map((layer) => layer.key) },
              { key: 'category', label: 'Category selector', value: selectedCategory, options: ['all', 'meat', 'produce', 'baby', 'pantry', 'dairy'] },
              { key: 'chain', label: 'Chain selector', value: selectedChain, options: ['all', 'ica', 'coop', 'willys', 'hemkop', 'lidl'] },
              { key: 'region', label: 'Region / kommun selector', value: selectedRegion, options: ['stockholm', 'goteborg', 'malmo'] },
              { key: 'confidence', label: 'Confidence / freshness selector', value: selectedConfidence, options: ['all', 'fresh', 'aging', 'stale', 'high-confidence'] }
            ].map((field) => (
              <label className="font-black" key={field.key}>
                {field.label}
                <select className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2" defaultValue={field.value} name={field.key}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            ))}
            <button className="rounded-full bg-emerald-800 px-4 py-2 text-sm font-black text-white" type="submit">Apply layer controls</button>
          </form>
        </Card>
        <Card className="xl:col-span-2">
          <h2 className="text-2xl font-black">Selected detail panel</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            Click store pins to open store previews, kommun summaries to open market context, and nearby deals to open verified product pages.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link className="rounded-2xl bg-emerald-50 p-3 text-sm font-black text-emerald-950" href={`/map?layer=${encodeURIComponent(selectedLayer)}&region=${encodeURIComponent(selectedRegion)}`}>
              Active layer: {selectedLayer}
            </Link>
            <Link className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-800" href={selectedCategory === 'all' ? '/browse' : `/browse/${encodeURIComponent(selectedCategory)}`}>
              Category: {selectedCategory}
            </Link>
            <Link className="rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-800" href={selectedChain === 'all' ? '/stores' : `/search?chain=${encodeURIComponent(selectedChain)}`}>
              Chain: {selectedChain}
            </Link>
          </div>
          {selectedFuelStation ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4" data-gv-event="map_marker_selected" data-gv-entity-type="fuel_station">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-800">Fuel selected station detail</p>
              <h3 className="mt-1 text-xl font-black text-amber-950">{selectedFuelStation.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-amber-950">{selectedFuelStation.address} · {selectedFuelStation.gradeAvailability}</p>
              <p className="mt-2 rounded-2xl bg-white/80 p-3 text-sm font-black leading-6 text-amber-950">{selectedFuelStation.guardrail}</p>
              <p className="mt-2 text-xs font-bold text-amber-900">{selectedFuelStation.sourceLabel} · refreshed {selectedFuelStation.freshnessLabel}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link className="rounded-full bg-amber-900 px-3 py-2 text-xs font-black text-white" href={`/fuel/stations/${selectedFuelStation.station.osmId}`}>Open fuel station detail</Link>
                <Link className="rounded-full bg-white px-3 py-2 text-xs font-black text-amber-950" href={selectedFuelStation.watchlistHref}>Save fuel station</Link>
              </div>
            </div>
          ) : selectedDomain === 'fuel' ? (
            <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-black text-amber-950">Fuel map layer is active. Choose a station from /search?domain=fuel or /fuel/stations to open /map?domain=fuel&station=[id]. Operator-level price guardrail stays visible until station-specific evidence exists.</p>
            </div>
          ) : null}
          {selectedDomain === 'pharmacy' ? (
            <div className="mt-4 rounded-3xl border border-sky-200 bg-sky-50 p-4" data-gv-event="map_marker_selected" data-gv-entity-type="pharmacy">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Pharmacy selected source detail</p>
              <h3 className="mt-1 text-xl font-black text-sky-950">{selectedPharmacy.title}</h3>
              <p className="mt-2 text-sm font-bold leading-6 text-sky-950">OTC coverage/source freshness: {selectedPharmacy.rowCount} public catalog rows · refreshed {selectedPharmacy.retrievedAt}</p>
              <p className="mt-2 rounded-2xl bg-white/80 p-3 text-sm font-black leading-6 text-sky-950">No stock or prescription claim. {selectedPharmacy.guardrail}</p>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {selectedPharmacy.sampleRows.slice(0, 4).map((row) => (
                  <Link className="rounded-2xl bg-white p-3 text-xs font-black text-sky-950" href={row.href} key={`${selectedPharmacy.chain}-${row.ean}`}>
                    {row.name} · {row.priceLabel}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      <SavedViewActions
        href="/map"
        label="Store map with chain-index overlay"
        resultLabel={`${visibleStores.length} visible OSM stores · ${selectedHoursFilter ?? 'all-hours'} · chain-index marker colors · no private location by default`}
        state={{ hours: selectedHoursFilter ?? 'all', overlay: 'chain-index', routeMode: routeAwareNearestStorePlan.mode, sort: 'map-center-distance', view: 'store-map' }}
        surface="map"
      />

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-800">Operating-hours filter</p>
            <h2 className="mt-2 text-2xl font-black text-emerald-950">Avoid closed stores in comparison views</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-emerald-900">
              {visibleStores.length.toLocaleString('sv-SE')} mapped stores match {selectedHoursFilter ? operatingHoursFilters.find((filter) => filter.id === selectedHoursFilter)?.label.toLowerCase() : 'all visible hours states'}.
              Filtered map markers still use OSM source hours and do not infer branch prices or private shopper location.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {operatingHoursFilters.map((filter) => (
              <a
                className={`rounded-full px-3 py-2 text-sm font-black ${filter.id === selectedHoursFilter ? 'bg-emerald-800 text-white' : 'bg-white text-emerald-950 hover:bg-emerald-100'}`}
                href={filter.href}
                key={filter.label}
                title={filter.detail}
              >
                {filter.label}
              </a>
            ))}
          </div>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden border-slate-200 bg-slate-950 p-0 text-white">
        <div className="grid gap-4 p-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-300">Synced map + list</p>
            <h2 className="mt-2 text-3xl font-black">Interactive store map with linked list selection</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-200">
              The map ↔ list sync uses verified OSM coordinates and chain-index proxy colors. Cluster and marker popovers expose map-center distance plus source-provided hours status without inventing branch-level basket prices; the nearest-store finder can rank by approved browser location, open-window signal, and pickup preference.
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-200">Selection model</p>
            <p className="mt-2 text-2xl font-black text-white">Account-safe map UX</p>
            <p className="mt-2 text-sm font-semibold text-slate-200">No private shopper location is read by default.</p>
          </div>
        </div>
        <div className="h-[620px] overflow-hidden border-t border-white/10 bg-slate-900">
          <StoreMap nearbyDealRecommendations={nearbyDealRecommendations} routeRecommendations={topRouteSavingsHints.slice(0, 3)} stores={visibleStores} />
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Nearby deal recommendations</p>
            <h2 className="mt-2 text-3xl font-black text-fuchsia-950">High-savings products near visible Coop map stores</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-fuchsia-900">
              The map requests browser geolocation only after shopper consent. Until then, Stockholm map-center distance ranks current flyer savings against visible Coop markers.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Savings candidates</p>
            <p className="mt-2 text-2xl font-black text-fuchsia-950">{nearbyDealRecommendations.length}</p>
            <p className="mt-2 text-sm font-semibold text-fuchsia-900">sorted by distance + SEK saved</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {nearbyDealRecommendations.map((deal) => (
            <Link className="rounded-2xl border border-fuchsia-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-fuchsia-200" data-nearby-deal-recommendation={deal.storeSlug} href={`/products/${encodeURIComponent(slugifyRouteValue(deal.dealName))}`} key={deal.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">{deal.chainName} · {deal.areaLabel}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{deal.dealName}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{deal.packageText || deal.sourceStoreName}</p>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-xl bg-fuchsia-50 p-3">
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-fuchsia-700">Save</dt>
                  <dd className="mt-1 font-black text-fuchsia-950">{deal.savingsSek.toFixed(2)} SEK</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">Nearby</dt>
                  <dd className="mt-1 font-black text-slate-950">{(deal.distanceMeters / 1000).toFixed(1)} km</dd>
                </div>
              </dl>
              <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-700">
                {deal.offerMechanicText || `${deal.offerPrice.toFixed(2)} SEK`} · {deal.medMeraRequired ? 'MedMera required' : 'No member flag'}
              </p>
            </Link>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-cyan-200 bg-cyan-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Route-aware nearest stores</p>
            <h2 className="mt-2 text-3xl font-black text-cyan-950">Nearest recommendations with basket cost and opening status</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-cyan-900">
              {routeAwareNearestStorePlan.summary} The static map uses a sample basket and Stockholm map-center routing;
              a signed-in shopper must consent before private location or list data can replace these defaults.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800">Rank inputs</p>
            <p className="mt-2 text-2xl font-black text-cyan-950">{routeAwareNearestStorePlan.routeRankInputs.length} signals</p>
            <p className="mt-2 text-sm font-semibold text-cyan-900">{routeAwareNearestStorePlan.mode} route · no private GPS by default</p>
          </div>
        </div>
        <MapNearbyStorePreviews
          stores={topRouteSavingsHints.map((store) => ({
            id: store.id,
            storeName: store.storeName,
            chainName: store.chainName,
            basketTotalSek: store.basketTotalSek,
            areaLabel: store.areaLabel
          }))}
        />
        {topRouteSavingsHints[0] ? (
          <StoreDistanceCard
            fallbackLabel="Use the route-aware list above while location is unavailable, then verify stock before leaving."
            inventoryConfidence={topRouteAwareStoreInventory[0] ?? undefined}
            expectedBasketSavingsSek={topRouteSavingsHints[0].expectedBasketSavingsSek}
            routeHints={topRouteSavingsHints[0].routeEstimates}
            storeName={topRouteSavingsHints[0].storeName}
          />
        ) : null}
      </Card>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Cheapest chain near me</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-950">{cheapestChainNearMe?.chainId ?? 'No chain index available'}</h2>
            <p className="mt-2 text-sm font-semibold text-emerald-900">
              Based on calculateChainPriceIndex over normalized chain observations, not individual branch checkout quotes.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">Index score</p>
            <p className="mt-2 text-4xl font-black text-emerald-950">{cheapestChainNearMe ? cheapestChainNearMe.overallIndex.toFixed(1) : 'n/a'}</p>
            <p className="mt-2 text-sm font-semibold text-emerald-900">{cheapestChainNearMe ? `${cheapestChainNearMe.confidence} confidence · ${cheapestChainNearMe.categoriesCovered} categories` : 'No coverage'}</p>
          </div>
        </div>
      </Card>

      <Card className="mt-6 border-lime-200 bg-lime-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-700">Cheapest branch near me</p>
            <h2 className="mt-2 text-3xl font-black text-lime-950">
              {cheapestBranchNearMe?.storeName ?? 'No branch-level candidate yet'}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-lime-900">
              This branch-level evidence uses per-branch Lidl offer observations matched to OSM store rows; it does not claim a shopper location or route time.
              No private location is read until the shopper explicitly approves location context.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-lime-700">Branch evidence</p>
            <p className="mt-2 text-2xl font-black text-lime-950">
              {cheapestBranchNearMe ? `${cheapestBranchNearMe.cheaperThanNationalLabel} cheaper than national cohort` : 'Blocked'}
            </p>
            <p className="mt-2 text-sm font-semibold text-lime-900">
              {cheapestBranchNearMe ? cheapestBranchNearMe.coverageLabel : 'No per-branch Lidl offer observations matched to OSM yet'}
            </p>
          </div>
        </div>
        {cheapestBranchNearMe ? (
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Kommun cohort</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.kommun}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.kommunCohortSize} stores · {cheapestBranchNearMe.cheaperThanKommunLabel} cheaper than kommun cohort</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">National percentile</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.nationalPricePercentileLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.statusLabel}</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-lime-700">Source confidence</p>
              <p className="mt-2 text-lg font-black text-slate-950">{cheapestBranchNearMe.confidenceLabel}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{cheapestBranchNearMe.source}</p>
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="mt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">District price heat overlay</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
              District heat uses OSM store districts plus each store brand's chain-index proxy. It is not a branch-price claim; districts with missing chain coverage are excluded from the ranked overlay.
            </p>
          </div>
          <p className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-slate-700">chain-index proxy</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {districtHeatOverlay.map((district) => (
            <div className={`rounded-2xl p-4 ${heatTone(district.averageIndex)}`} key={district.district}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-black">{district.district}</p>
                  <p className="mt-1 text-sm font-semibold opacity-80">{district.coveredStores} of {district.totalStores} stores covered · {district.chainCount} chains</p>
                </div>
                <p className="text-3xl font-black">{district.averageIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-xs font-semibold opacity-80">Coverage {formatPct(district.coverageShare * 100)} of OSM stores in district.</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">{basketCostHeatmap.statusLabel}</p>
            <h2 className="mt-2 text-3xl font-black text-fuchsia-950">Basket-cost heatmap by area</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-fuchsia-900">
              The map now shows area rows from the visible weekly basket optimizer. compareBasketStrategies and summarizeStoreBasketCoverage price only known favorite-store rows, so missing basket products stay visible as coverage gaps. No branch-level basket quote is claimed.
            </p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-800">Basket rows</p>
            <p className="mt-2 text-3xl font-black text-fuchsia-950">{basketCostHeatmap.rows.length}</p>
            <p className="mt-2 text-sm font-semibold text-fuchsia-900">{basketCostHeatmap.basketLineCount} basket lines · {basketCostHeatmap.favoriteStoreCount} favorite stores</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {basketCostHeatmap.rows.map((row) => (
            <div className={`rounded-2xl border p-4 ${basketHeatTone(row.heatTone)}`} data-basket-cost-heatmap={row.area} key={row.storeId}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{row.area}</p>
                  <p className="mt-2 text-lg font-black">{row.storeName}</p>
                </div>
                <p className="rounded-full bg-white/85 px-3 py-2 text-xl font-black">{row.relativeBasketIndex.toFixed(1)}</p>
              </div>
              <p className="mt-3 text-sm font-black">{row.knownBasketTotal.toFixed(2)} SEK known basket total</p>
              <p className="mt-1 text-xs font-semibold leading-5 opacity-80">
                Coverage {formatPct(row.coveragePercent)} · {row.pricedProductCount} priced · {row.missingProductCount} missing.
              </p>
              <p className="mt-3 rounded-xl bg-white/75 p-2 text-xs font-bold leading-5 opacity-80">{row.areaEvidence}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 md:grid-cols-3">
          {basketCostHeatmap.guardrails.map((guardrail) => (
            <li className="rounded-2xl bg-white/80 p-3 text-xs font-bold leading-5 text-fuchsia-950" key={guardrail}>{guardrail}</li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-700">{regionalPriceStatisticsGate.title}</p>
            <h2 className="mt-2 text-3xl font-black text-sky-950">Regional price statistics gate</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-sky-900">{regionalPriceStatisticsGate.detail}</p>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-right">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-700">Status</p>
            <p className="mt-2 text-2xl font-black text-sky-950">{regionalPriceStatisticsGate.statusLabel}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl bg-white/85 p-4">
            <h3 className="text-lg font-black text-sky-950">City statistics coverage</h3>
            <div className="mt-3 grid gap-3">
              {regionalPriceStatisticsGate.cityPriceStatisticRows.map((city) => (
                <div className="rounded-2xl border border-sky-100 p-3" key={city.label}>
                  <p className="font-black text-slate-950">{city.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{city.coveredStores} of {city.totalStores} stores chain-index covered · {city.chainCount} chains</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Coverage {formatPct(city.coverageShare * 100)} · statistic {city.statisticLabel}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{city.detail}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-white/85 p-4">
            <h3 className="text-lg font-black text-sky-950">District statistics coverage</h3>
            <div className="mt-3 grid gap-3">
              {regionalPriceStatisticsGate.districtPriceStatisticRows.map((district) => (
                <div className="rounded-2xl border border-sky-100 p-3" key={district.label}>
                  <p className="font-black text-slate-950">{district.label}</p>
                  <p className="mt-1 text-sm font-semibold text-slate-700">{district.coveredStores} of {district.totalStores} stores chain-index covered · {district.chainCount} chains</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">Coverage {formatPct(district.coverageShare * 100)} · statistic {district.statisticLabel}</p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{district.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 rounded-2xl bg-white/85 p-4">
          <p className="text-sm font-black text-sky-950">Required confidence/coverage before regional stats unlock</p>
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-sky-900">
            {regionalPriceStatisticsGate.requiredEvidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </Card>

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {visibleStores.map((store) => {
            const chain = chainIndexByBrand.get(normaliseBrand(store.brand));
            return (
              <div className={`rounded-2xl border p-4 ${markerTone(chain?.overallIndex)}`} key={store.slug}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-black">{store.name}</p>
                    <p className="text-sm opacity-80">{store.lat.toFixed(5)}, {store.lng.toFixed(5)}</p>
                    <p className="text-sm opacity-80">{store.brand}</p>
                  </div>
                  <span className="rounded-full bg-white/80 px-2 py-1 text-xs font-black">{chain ? chain.overallIndex.toFixed(0) : '—'}</span>
                </div>
                <p className="mt-3 text-xs font-semibold opacity-80">{chain ? `${formatPct(chain.overallIndex - 100)} vs market index · ${chain.confidence} confidence` : 'No chain-index coverage for this brand'}</p>
              </div>
            );
          })}
        </div>
      </Card>
    </PageShell>
  );
}
