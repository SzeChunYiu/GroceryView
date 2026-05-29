import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { FuelDetourCalc } from '@/components/fuel-detour-calc';
import { ChartShell, ChartTableFallback, DistributionBand, Sparkline } from '@/components/mvp/visual-intelligence';
import { PriceChartTerminal, type PriceChartTerminalModel, type PriceChartTerminalSeries } from '@/components/price-chart-terminal';
import { formatFuelPrice, fuelPriceSourceSchema, fuelPriceTargetAlerts, type VerifiedFuelPriceObservation, verifiedFuelPriceObservations, verifiedFuelPriceSource } from '@/lib/fuel-prices';
import { fuelStations, fuelStationSource, type FuelStationChain } from '@/lib/ingested/fuel-stations';
import { st1FuelPriceObservations, st1FuelPriceSource } from '@/lib/ingested/st1-fuel-prices';
import { fuelCrowdSubmissionPolicy, fuelStationSourceCoverage, multiVerticalDomainFoundation } from '@/lib/verified-data';
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

function stationSupportedGrades(station: (typeof fuelStations)[number]) {
  return station.supportedGradeIds?.length ? station.supportedGradeIds.join(', ') : 'Grade support not tagged';
}

type FuelGrade = VerifiedFuelPriceObservation['grade'];
type FuelTerminalRow = {
  id: string;
  grade: FuelGrade;
  label: string;
  operatorId: 'okq8' | 'st1';
  operatorName: 'OKQ8' | 'St1';
  pricePerLitre: number;
  observedAt: string;
  effectiveFrom: string;
  confidence: number;
  sourceUrl: string;
  sourceLabel: string;
};

const currentLocation = { latitude: 59.3293, longitude: 18.0686, label: 'Stockholm' };
const gradeOptions: Array<{ value: FuelGrade; label: string }> = [
  { value: '95', label: '95 E10' },
  { value: '98', label: '98' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'hvo100', label: 'HVO100' },
  { value: 'e85', label: 'E85' }
];

const fuelTerminalRows: FuelTerminalRow[] = [
  ...verifiedFuelPriceObservations.map((row) => ({
    id: row.id,
    grade: row.grade,
    label: row.label,
    operatorId: 'okq8' as const,
    operatorName: 'OKQ8' as const,
    pricePerLitre: row.pricePerLitre,
    observedAt: row.observedAt,
    effectiveFrom: row.effectiveFrom,
    confidence: row.confidence,
    sourceUrl: row.sourceUrl,
    sourceLabel: verifiedFuelPriceSource.name
  })),
  ...st1FuelPriceObservations.map((row) => ({
    id: row.id,
    grade: row.grade.toLowerCase() as FuelGrade,
    label: row.label,
    operatorId: 'st1' as const,
    operatorName: 'St1' as const,
    pricePerLitre: row.pricePerLitre,
    observedAt: row.observedAt,
    effectiveFrom: row.validFrom.slice(0, 10),
    confidence: row.confidence,
    sourceUrl: row.sourceUrl,
    sourceLabel: st1FuelPriceSource.source
  }))
];

function selectedFuelGrade(value: string | string[] | undefined): FuelGrade {
  const candidate = Array.isArray(value) ? value[0] : value;
  return gradeOptions.some((option) => option.value === candidate) ? candidate as FuelGrade : '95';
}

function distanceKm(
  left: { latitude: number; longitude: number },
  right: { latitude: number; longitude: number }
) {
  const earthRadiusKm = 6371;
  const latDelta = ((right.latitude - left.latitude) * Math.PI) / 180;
  const lonDelta = ((right.longitude - left.longitude) * Math.PI) / 180;
  const leftLat = (left.latitude * Math.PI) / 180;
  const rightLat = (right.latitude * Math.PI) / 180;
  const haversine = Math.sin(latDelta / 2) ** 2 + Math.cos(leftLat) * Math.cos(rightLat) * Math.sin(lonDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(haversine));
}

function formatKm(value: number) {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} km`;
}

function fuelTerminalChartFor(rows: FuelTerminalRow[], gradeLabel: string): PriceChartTerminalModel {
  const series: PriceChartTerminalSeries[] = ['okq8', 'st1'].flatMap((operatorId): PriceChartTerminalSeries[] => {
    const operatorRows = rows
      .filter((row) => row.operatorId === operatorId)
      .sort((left, right) => left.observedAt.localeCompare(right.observedAt));
    if (operatorRows.length === 0) return [];
    const operatorName = operatorRows[0]!.operatorName;

    return [{
      id: `fuel-${operatorId}-${gradeLabel}`,
      storeName: operatorName,
      sourceType: 'operator_public_price_page',
      lineStyle: operatorId === 'okq8' ? 'solid' : 'dashed',
      points: operatorRows.map((row) => ({
        time: row.observedAt.slice(0, 10),
        value: row.pricePerLitre,
        confidence: row.confidence,
        provenanceLabel: row.sourceLabel
      })),
      markers: operatorRows.map((row) => ({
        time: row.observedAt.slice(0, 10),
        text: formatFuelPrice(row.pricePerLitre),
        color: operatorId === 'okq8' ? '#0b65c6' : '#f3c300',
        provenanceLabel: row.sourceLabel
      }))
    }];
  });
  const prices = rows.map((row) => row.pricePerLitre);
  const latest = [...rows].sort((left, right) => right.observedAt.localeCompare(left.observedAt))[0];

  return {
    available: series.length > 0,
    title: `${gradeLabel} fuel price view`,
    sourceLabel: 'Operator fuel price history',
    confidenceLabel: 'Operator page confidence; no station pump inference',
    caveat: 'History points are sourced from public operator price pages. Station dots are locations only unless station-level prices are explicitly observed.',
    defaultWindow: 'ALL',
    windows: [{
      label: 'ALL',
      rangeLabel: 'all verified fuel rows',
      windowStart: rows.map((row) => row.observedAt).sort()[0],
      windowEnd: latest?.observedAt,
      pointCount: rows.length,
      markerCount: rows.length,
      latestValueLabel: latest ? formatFuelPrice(latest.pricePerLitre) : 'Not reported',
      latestObservedAt: latest?.observedAt,
      lowValueLabel: prices.length ? formatFuelPrice(Math.min(...prices)) : 'Not reported',
      highValueLabel: prices.length ? formatFuelPrice(Math.max(...prices)) : 'Not reported',
      series
    }]
  };
}

export default async function FuelPage({ searchParams }: Readonly<{ searchParams?: Promise<{ grade?: string | string[] }> }>) {
  const query = searchParams ? await searchParams : {};
  const selectedGrade = selectedFuelGrade(query.grade);
  const selectedGradeLabel = gradeOptions.find((option) => option.value === selectedGrade)!.label;
  const selectedGradeRows = fuelTerminalRows.filter((row) => row.grade === selectedGrade);
  const cheapestSelectedGrade = [...selectedGradeRows].sort((a, b) => a.pricePerLitre - b.pricePerLitre || a.operatorName.localeCompare(b.operatorName, 'sv-SE'))[0]!;
  const selectedOperatorStations = fuelStations
    .filter((station) => station.chain === cheapestSelectedGrade.operatorName)
    .map((station) => ({ ...station, distanceKm: distanceKm(currentLocation, station) }))
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, 5);
  const nearestSelectedStation = selectedOperatorStations[0];
  const fuelTerminalChart = fuelTerminalChartFor(selectedGradeRows, selectedGradeLabel);
  const selectedGradePrices = selectedGradeRows.map((row) => row.pricePerLitre);
  const selectedGradeMin = Math.min(...selectedGradePrices);
  const selectedGradeMax = Math.max(...selectedGradePrices);
  const fuelVisualRows = [...selectedGradeRows]
    .sort((left, right) => left.pricePerLitre - right.pricePerLitre || right.confidence - left.confidence)
    .map((row) => {
      const operatorHistory = selectedGradeRows
        .filter((candidate) => candidate.operatorId === row.operatorId)
        .sort((left, right) => left.observedAt.localeCompare(right.observedAt));
      return {
        ...row,
        priceLabel: formatFuelPrice(row.pricePerLitre),
        confidenceLabel: `${Math.round(row.confidence * 100)}% confidence`,
        priceHistoryMiniLine: operatorHistory.map((point) => ({
          label: point.observedAt.slice(0, 10),
          value: point.pricePerLitre
        }))
      };
    });
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === 'fuel')!;
  const lowest = [...fuelTerminalRows].sort((a, b) => a.pricePerLitre - b.pricePerLitre)[0]!;
  const freshestDate = fuelTerminalRows
    .map((row) => row.effectiveFrom)
    .sort()
    .at(-1)!;
  const fuelChainRows = Object.entries(fuelStationSource.chainCounts) as [FuelStationChain, number][];
  const northernMostStation = fuelStations.reduce((top, station) => (station.latitude > top.latitude ? station : top), fuelStations[0]);
  const southernMostStation = fuelStations.reduce((bottom, station) => (station.latitude < bottom.latitude ? station : bottom), fuelStations[0]);

  return (
    <PageShell>
      <Eyebrow>Verified fuel price rows</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Fuel prices by grade</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        GroceryView shows fuel as verified price per litre rows with source dates, freshness, and confidence. OKQ8&apos;s public fuel price page is the first operator source; crowd-submitted prices stay hidden until trusted station evidence exists.
      </p>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Grade selector</p>
            <h2 className="mt-2 text-2xl font-black text-slate-950">{selectedGradeLabel} price view</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              Selected grade uses {selectedGradeRows.length} verified operator rows and highlights the cheapest operator-backed station candidates near {currentLocation.label}.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {gradeOptions.map((option) => (
              <Link
                className={option.value === selectedGrade ? 'rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white' : 'rounded-full bg-white px-4 py-2 text-sm font-black text-slate-700 shadow-sm'}
                href={`/fuel?grade=${option.value}`}
                key={option.value}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Observed rows</p>
          <p className="mt-2 text-5xl font-black text-slate-950">{fuelTerminalRows.length}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">All rows are verified fuel price rows measured per litre.</p>
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

      <div className="mt-6">
        <FuelDetourCalc currentFuelPrice={lowest.pricePerLitre} />
      </div>

      <div className="mt-6">
        <PriceChartTerminal chart={fuelTerminalChart} />
      </div>

      <div className="mt-6">
        <ChartShell
          actionHref="/fuel"
          actionLabel="Reset fuel view"
          evidenceItems={[
            `${selectedGradeRows.length} operator rows`,
            `Selected grade: ${selectedGradeLabel}`,
            'Operator-level price, not station-specific pump price'
          ]}
          hasData={fuelVisualRows.length > 0}
          insightTitle="Fuel visual command center"
          plainSummary={`Which operator-backed fuel rows are cheapest for the selected grade? ${selectedGradeLabel} compares public operator rows, source confidence, and nearby station candidates without turning operator prices into station pump claims.`}
          userQuestion="Where can I compare fuel prices by grade?"
          fallback={
            <ChartTableFallback
              caption="Fuel visual command center fallback"
              columns={[
                { key: 'grade', label: 'Grade', render: (row) => row.label },
                { key: 'operator', label: 'Operator', render: (row) => row.operatorName },
                { key: 'price', label: 'Price per litre', render: (row) => row.priceLabel },
                { key: 'effective', label: 'Effective from', render: (row) => row.effectiveFrom },
                { key: 'source', label: 'Source', render: (row) => row.sourceLabel },
                { key: 'confidence', label: 'Confidence', render: (row) => row.confidenceLabel }
              ]}
              rows={fuelVisualRows}
            />
          }
        >
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="grid gap-3 md:grid-cols-2">
              {fuelVisualRows.map((row) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${row.id}-visual`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{row.label}</p>
                      <h3 className="mt-1 text-lg font-black text-slate-950">{row.operatorName}</h3>
                    </div>
                    <p className="rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800">{row.confidenceLabel}</p>
                  </div>
                  <p className="mt-3 text-3xl font-black text-emerald-800">{row.priceLabel}</p>
                  <DistributionBand
                    current={row.pricePerLitre}
                    label={`${row.operatorName} ${row.label} price band`}
                    max={selectedGradeMax}
                    min={selectedGradeMin}
                  />
                  <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl bg-white p-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">Mini line</p>
                      <p className="mt-1 text-xs font-semibold text-slate-600">{row.sourceLabel}</p>
                    </div>
                    <Sparkline label={`${row.operatorName} ${row.label} fuel price history mini line`} points={row.priceHistoryMiniLine} />
                  </div>
                  <p className="mt-3 text-xs font-bold leading-5 text-slate-600">
                    Effective from {row.effectiveFrom}. Operator-level price, not station-specific pump price.
                  </p>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-sky-800">Nearest station candidates</p>
              <h3 className="mt-2 text-xl font-black text-slate-950">Location context for the cheapest operator</h3>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                Candidate stations are filtered by the selected cheapest operator and sorted by distance from {currentLocation.label}. They remain location evidence only.
              </p>
              <div className="mt-4 space-y-3">
                {selectedOperatorStations.slice(0, 4).map((station) => (
                  <div className="rounded-2xl bg-white p-3 text-sm shadow-sm" key={`${station.osmType}-${station.osmId}-visual`}>
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black text-slate-950">{station.name}</p>
                      <p className="font-black text-sky-900">{formatKm(station.distanceKm)}</p>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{stationAddress(station) || 'Address not tagged'}</p>
                    <p className="mt-2 text-xs font-bold text-slate-500">Operator-level price, not station-specific pump price.</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartShell>
      </div>

      <Card className="mt-6 border-sky-200 bg-sky-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Cheapest station near me</Eyebrow>
            <h2 className="mt-2 text-2xl font-black text-slate-950">
              {nearestSelectedStation ? `${nearestSelectedStation.name} is the nearest ${cheapestSelectedGrade.operatorName} candidate` : `No ${cheapestSelectedGrade.operatorName} station candidates found`}
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {selectedGradeLabel} cheapest operator row: {formatFuelPrice(cheapestSelectedGrade.pricePerLitre)} from {cheapestSelectedGrade.sourceLabel}. Station distance uses OSM coordinates near {currentLocation.label}; the operator row is not claimed as a station-specific pump price.
            </p>
          </div>
          <p className="rounded-2xl bg-white p-4 text-center text-sm font-black text-sky-950 shadow-sm">
            {nearestSelectedStation ? formatKm(nearestSelectedStation.distanceKm) : 'No distance'}
          </p>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-5">
          {selectedOperatorStations.map((station) => (
            <div className="rounded-2xl border border-sky-100 bg-white p-4 shadow-sm" key={`${station.osmType}-${station.osmId}-nearby`}>
              <p className="text-sm font-black text-slate-950">{station.name}</p>
              <p className="mt-2 text-xs font-bold text-slate-600">{stationAddress(station) || 'Address not tagged'}</p>
              <p className="mt-3 text-lg font-black text-sky-900">{formatKm(station.distanceKm)}</p>
            </div>
          ))}
        </div>
      </Card>

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
            <h2 className="text-2xl font-black">Per-grade price rows</h2>
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
                <th className="px-4 py-3">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {fuelTerminalRows.map((row) => (
                <tr className="border-t border-slate-200" key={row.id}>
                  <td className="px-4 py-3 font-black text-slate-950">{row.label}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.operatorName}</td>
                  <td className="px-4 py-3 font-black text-emerald-800">{formatFuelPrice(row.pricePerLitre)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.effectiveFrom}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.sourceLabel}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{Math.round(row.confidence * 100)}%</td>
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
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelPriceSourceSchema.operatorSourceKind} in {fuelPriceSourceSchema.sourceTable}, captured at {verifiedFuelPriceSource.capturedAt}.</p>
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

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-amber-800">{fuelCrowdSubmissionPolicy.sourceKind}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{fuelCrowdSubmissionPolicy.title}</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-700">
              {fuelCrowdSubmissionPolicy.driver} reuses {fuelCrowdSubmissionPolicy.trustTable} before a station price can enter {fuelCrowdSubmissionPolicy.sourceTable}.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 text-right shadow-sm">
            <p className="text-4xl font-black text-amber-900">{fuelCrowdSubmissionPolicy.maxFreshnessHours}h</p>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">freshness gate</p>
            <p className="mt-2 text-xs font-semibold text-slate-600">{fuelCrowdSubmissionPolicy.maxOutlierPercent}% outlier review</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Required fields</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelCrowdSubmissionPolicy.requiredFields.join(', ')}</p>
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-500">Evidence</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{fuelCrowdSubmissionPolicy.acceptedEvidenceTypes.join(', ')}</p>
          </div>
        </div>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-amber-950">
          {fuelCrowdSubmissionPolicy.publicDisplayGates.map((gate) => <li key={gate}>{gate}</li>)}
        </ul>
      </Card>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Fuel grades ready for comparison</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {domain.seedItems.map((item) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.id}>
              <p className="font-black text-slate-950">{item.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-700">Compared per litre with exact grade labels, source dates, and confidence.</p>
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
              Fuel station locations come from OpenStreetMap fuel-station data for {fuelStationSourceCoverage.stationScope}. They show location and grade-availability evidence only; the price table above comes from verified operator fuel price rows.
            </p>
          </div>
          <div className="rounded-lg bg-white p-4 text-right shadow-sm">
            <p className="text-4xl font-black text-indigo-900">{fuelStationSourceCoverage.priceObservationCount}</p>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Station price rows</p>
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
                className={station.chain === cheapestSelectedGrade.operatorName ? 'absolute z-20 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg shadow-sky-900/30' : 'absolute z-10 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-sm'}
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
          <div className="hidden grid-cols-[1fr_0.5fr_1fr_0.9fr_0.6fr_0.6fr] gap-3 border-b border-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500 md:grid">
            <span>Station</span>
            <span>Chain</span>
            <span>Address</span>
            <span>Supported grades</span>
            <span>Latitude</span>
            <span className="text-right">Longitude</span>
          </div>
          {fuelStations.slice(0, 120).map((station) => (
            <div
              className="grid gap-2 border-b border-slate-100 px-4 py-3 text-sm last:border-b-0 md:grid-cols-[1fr_0.5fr_1fr_0.9fr_0.6fr_0.6fr]"
              key={`${station.osmType}-${station.osmId}-row`}
            >
              <Link className="min-w-0 underline-offset-4 hover:underline" href={`/fuel/stations/${station.osmId}`}>
                <span className="block truncate font-black text-slate-950">{station.name}</span>
                <span className="mt-1 block text-xs font-semibold text-slate-500">OSM {station.osmType}/{station.osmId}</span>
              </Link>
              <span className="font-semibold text-slate-700">{station.chain}</span>
              <span className="truncate text-slate-600">{stationAddress(station) || 'Address not tagged'}</span>
              <span className="text-xs font-semibold leading-5 text-slate-600">{stationSupportedGrades(station)}</span>
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
