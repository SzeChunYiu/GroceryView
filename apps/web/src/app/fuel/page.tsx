import Link from 'next/link';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatFuelPrice, verifiedFuelPriceObservations, verifiedFuelPriceSource } from '@/lib/fuel-prices';
import { fuelStationSourceCoverage, multiVerticalDomainFoundation } from '@/lib/verified-data';
import { routeMetadata } from '@/lib/seo';

export function generateMetadata() {
  return routeMetadata('/fuel');
}

function freshnessLabel(value: string) {
  return value.slice(0, 10);
}

export default function FuelPage() {
  const domain = multiVerticalDomainFoundation.find((candidate) => candidate.slug === 'fuel')!;
  const lowest = [...verifiedFuelPriceObservations].sort((a, b) => a.pricePerLitre - b.pricePerLitre)[0]!;
  const freshestDate = verifiedFuelPriceObservations
    .map((row) => row.effectiveFrom)
    .sort()
    .at(-1)!;

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
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Public operator price page, parser version {verifiedFuelPriceSource.parserVersion}, captured at {verifiedFuelPriceSource.capturedAt}.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">Crowd source</p>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">Schema supports trusted station reports, but no crowd fuel prices are rendered on this page yet.</p>
          </div>
        </div>
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
