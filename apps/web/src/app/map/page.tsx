import { calculateChainPriceIndex } from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { buildChainPriceObservations } from '@/lib/chain-index-data';
import { formatPct, storeUniverse } from '@/lib/verified-data';

const chainIndexSummary = calculateChainPriceIndex(buildChainPriceObservations());
const chainIndexByBrand = new Map(chainIndexSummary.chains.map((chain) => [chain.chainId.toLowerCase(), chain]));
const cheapestChainNearMe = chainIndexSummary.chains[0];
const districtHeatOverlay = buildDistrictHeatOverlay();

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

export default function MapPage() {
  const visibleStores = storeUniverse.slice(0, 80);
  return (
    <PageShell>
      <Eyebrow>Map data</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Store coordinates with chain-index signals</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        The website has verified latitude and longitude for OSM stores. Markers are colored by the chain-level price index only; branch-level prices, route times, and store quality scores are not invented.
      </p>

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
