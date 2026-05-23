import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatFuelPrice, fuelPriceSourceSchema, fuelPriceTargetAlerts, verifiedFuelPriceObservations, verifiedFuelPriceSource } from '@/lib/fuel-prices';
import { fuelStations, fuelStationSource, type FuelStationChain } from '@/lib/ingested/fuel-stations';
import { fuelStationSourceCoverage, multiVerticalDomainFoundation } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/fuel');
}

function freshnessLabel(value: string) {
  return value.slice(0, 10);
}

const fuelMapBounds = {
  minLat: 55.2,
  maxLat: 69.2,
  minLon: 10.6,
  maxLon: 24.3
};

const fuelChainColors: Record<FuelStationChain, string> = {
  'Circle K': '#d71920',
  OKQ8: '#0b65c6',
  Preem: '#118849',
  St1: '#f3c300',
  Ingo: '#f06a00',
  Tanka: '#22a6b3',
  Qstar: '#6f42c1',
  Shell: '#ffd100'
};

function fuelStationPosition(latitude: number, longitude: number) {
  const x = ((longitude - fuelMapBounds.minLon) / (fuelMapBounds.maxLon - fuelMapBounds.minLon)) * 100;
  const y = (1 - (latitude - fuelMapBounds.minLat) / (fuelMapBounds.maxLat - fuelMapBounds.minLat)) * 100;

  return {
    left: `${Math.min(98, Math.max(2, x))}%`,
    top: `${Math.min(98, Math.max(2, y))}%`
  };
}

function stationAddress(station: (typeof fuelStations)[number]) {
  return [station.street, station.houseNumber, station.postcode, station.city].filter(Boolean).join(', ');
}

export default function FuelPage() {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === 'fuel')!;
  const lowest = [...verifiedFuelPriceObservations].sort((a, b) => a.pricePerLitre - b.pricePerLitre)[0]!;
  const freshestDate = verifiedFuelPriceObservations
    .map((row) => row.effectiveFrom)
    .sort()
    .at(-1)!;
  const fuelChainRows = Object.entries(fuelStationSource.chainCounts) as [FuelStationChain, number][];
  const northernMostStation = fuelStations.reduce((top, station) => (station.latitude > top.latitude ? station : top), fuelStations[0]);
  const southernMostStation = fuelStations.reduce((bottom, station) => (station.latitude < bottom.latitude ? station : bottom), fuelStations[0]);

  return (
    <PageShell>
      <Eyebrow>{domain.label} observations</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Fuel prices by grade</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView now renders fuel only from domain=fuel observations with price per litre and source provenance. The first operator source is OKQ8&apos;s public fuel price page; crowd reports remain schema-ready but empty.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observed rows</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{verifiedFuelPriceObservations.length}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">All rows are domain=fuel and unit=litre.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Lowest shown</p>
          <p className="mt-2 text-4xl font-black text-emerald-800">{formatFuelPrice(lowest.pricePerLitre)}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{lowest.label} from {lowest.operatorName}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Freshest effective date</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{freshestDate}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Captured {freshnessLabel(verifiedFuelPriceSource.capturedAt)}.</p>
        </Card>
      </div>

      <Card className="mt-6 border-emerald-200 bg-emerald-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>{fuelPriceTargetAlerts.source}</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-emerald-950">Fuel target price alerts</h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-emerald-950">
              The fuel lane now adapts GroceryView&apos;s real watchlist alert engine to operator fuel rows: targets are shopper-defined kr/l thresholds, and triggered alerts stay scoped to the OKQ8 operator price page evidence.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-emerald-950 shadow-sm">
            {fuelPriceTargetAlerts.alertCount} active · {fuelPriceTargetAlerts.targetCount} watched
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {fuelPriceTargetAlerts.targets.map((target) => (
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={target.id}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{target.name}</p>
              <h3 className="mt-2 text-lg font-black text-slate-950">{target.label}</h3>
              <p className="mt-2 text-sm font-semibold text-slate-700">{target.targetLabel} · observed {target.observedPriceLabel}</p>
              <p className={target.isTriggered ? 'mt-3 text-sm font-black text-emerald-800' : 'mt-3 text-sm font-black text-slate-600'}>
                {target.isTriggered ? 'Alert active from verified operator row' : 'Watching; current price is still above target'}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {fuelPriceTargetAlerts.alerts.map((alert) => (
            <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm" key={`${alert.productId}-${alert.type}`}>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-800">{alert.alertName}</p>
              <p className="mt-2 text-lg font-black text-slate-950">{alert.productName}: {alert.observedPriceLabel} is below {alert.targetLabel}</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{alert.evidence}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {fuelPriceTargetAlerts.guardrails.map((guardrail) => (
            <p className="rounded-2xl bg-white p-3 text-xs font-bold leading-5 text-emerald-950" key={guardrail}>{guardrail}</p>
          ))}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-black">Per-grade observations</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{verifiedFuelPriceSource.caveat}</p>
          </div>
          <Link className="text-sm font-black text-emerald-800 underline decoration-emerald-300 underline-offset-4" href={verifiedFuelPriceSource.sourceUrl}>
            Open source
          </Link>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
              <tr>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Price per litre</th>
                <th className="px-4 py-3">Effective from</th>
                <th className="px-4 py-3">Source</th>
              </tr>
            </thead>
            <tbody>
              {verifiedFuelPriceObservations.map((row) => (
                <tr className="border-t border-slate-200" key={row.id}>
                  <td className="px-4 py-3 font-black text-slate-950">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.operatorName}</td>
                  <td className="px-4 py-3 font-black text-emerald-800">{formatFuelPrice(row.pricePerLitre)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.effectiveFrom}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.sourceType.replaceAll('_', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Source model</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">Operator source</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelPriceSourceSchema.operatorSourceKind} in {fuelPriceSourceSchema.sourceTable}, parser version {verifiedFuelPriceSource.parserVersion}, captured at {verifiedFuelPriceSource.capturedAt}.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">Crowd source</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelPriceSourceSchema.crowdSourceKind} rows require a trusted reporter and station evidence; no crowd fuel prices are rendered on this page yet.</p>
          </div>
        </div>
        <p className="mt-4 rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-700">
          {fuelPriceSourceSchema.gradeTable} + {fuelPriceSourceSchema.sourceObservationTable}: {fuelPriceSourceSchema.observationContract}.
        </p>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Supported fuel item model</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {domain.seedItems.map((item) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.id}>
              <p className="font-black text-slate-950">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">{item.id} · comparable unit: {item.comparableUnit} · {item.matchKey}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-indigo-200 bg-indigo-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-indigo-800">{fuelStationSourceCoverage.source}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">OSM fuel station source</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              The fuel station lane has a public Overpass connector contract: {fuelStationSourceCoverage.connector} posts an amenity=fuel query ({fuelStationSourceCoverage.overpassFilter}) for {fuelStationSourceCoverage.stationScope}. It is location and grade-availability evidence only; the price table above comes from operator domain=fuel observations.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 text-right shadow-sm">
            <p className="text-4xl font-black text-indigo-900">{fuelStationSourceCoverage.priceObservationCount}</p>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">OSM price observations</p>
            <p className="mt-2 text-xs font-semibold text-slate-600">{fuelStationSourceCoverage.status}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Station fields</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelStationSourceCoverage.fields.join(', ')}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Fuel grade tags</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelStationSourceCoverage.fuelGradeTags.join(', ')}</p>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-indigo-950">
          {fuelStationSourceCoverage.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
        </ul>
      </Card>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Overpass fuel locations</Eyebrow>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {fuelStationSource.rowCount.toLocaleString('sv-SE')} Swedish fuel stations with coordinates
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Real amenity=fuel rows fetched with curl from Overpass for Circle K, OKQ8, Preem, St1, Ingo, Tanka, Qstar, and Shell. These rows locate stations only; they do not create station-level pump price claims.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 text-right shadow-sm">
            <p className="text-3xl font-black text-sky-900">{fuelChainRows.length}</p>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">chains</p>
            <p className="mt-2 text-xs font-semibold text-slate-600">
              {northernMostStation.city || northernMostStation.name} north · {southernMostStation.city || southernMostStation.name} south
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative min-h-[560px] overflow-hidden rounded-lg border border-sky-100 bg-[#edf7f8]">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,23,42,0.06)_1px,transparent_1px),linear-gradient(0deg,rgba(15,23,42,0.06)_1px,transparent_1px)] bg-[size:48px_48px]" />
            <div className="absolute inset-x-[24%] bottom-[8%] top-[4%] rounded-[46%_48%_44%_42%] border border-sky-100 bg-white/65 shadow-inner" />
            {fuelStations.map((station) => (
              <span
                aria-label={`${station.name}, ${station.chain}`}
                className="absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-sm"
                key={`${station.osmType}-${station.osmId}`}
                style={{
                  ...fuelStationPosition(station.latitude, station.longitude),
                  backgroundColor: fuelChainColors[station.chain]
                }}
                title={`${station.name} · ${station.latitude.toFixed(5)}, ${station.longitude.toFixed(5)}`}
              />
            ))}
          </div>

          <div className="rounded-lg bg-white shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Chain coverage</p>
            </div>
            <div className="divide-y divide-slate-100">
              {fuelChainRows.map(([chain, count]) => (
                <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm" key={chain}>
                  <span className="flex min-w-0 items-center gap-2 font-black text-slate-900">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: fuelChainColors[chain] }} />
                    {chain}
                  </span>
                  <span className="font-black tabular-nums text-slate-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-lg border border-sky-100 bg-white">
          <div className="hidden grid-cols-[1fr_0.6fr_1fr_0.7fr_0.7fr] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 md:grid">
            <span>Station</span>
            <span>Chain</span>
            <span>Address</span>
            <span>Latitude</span>
            <span className="text-right">Longitude</span>
          </div>
          {fuelStations.slice(0, 120).map((station) => (
            <div
              className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_0.6fr_1fr_0.7fr_0.7fr]"
              key={`${station.osmType}-${station.osmId}-row`}
            >
              <span className="min-w-0">
                <span className="block truncate font-black text-slate-950">{station.name}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">OSM {station.osmType}/{station.osmId}</span>
              </span>
              <span className="font-semibold text-slate-700">{station.chain}</span>
              <span className="truncate text-slate-600">{stationAddress(station) || 'Address not tagged'}</span>
              <span className="tabular-nums text-slate-700">{station.latitude.toFixed(5)}</span>
              <span className="tabular-nums text-slate-700 md:text-right">{station.longitude.toFixed(5)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Claim boundary</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-amber-950">
          {domain.guardrails.map((guardrail) => <li key={guardrail}>{guardrail}</li>)}
          <li>Rows are operator price observations, not inferred station-level pump prices.</li>
        </ul>
        <Link className="mt-4 inline-block text-sm font-black text-amber-950 underline decoration-amber-300 underline-offset-4" href="/data-sources">
          Audit domain source coverage
        </Link>
      </Card>
    </PageShell>
  );
}
