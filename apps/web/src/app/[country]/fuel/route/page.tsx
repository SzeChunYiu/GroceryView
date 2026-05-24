import { notFound } from 'next/navigation';
import {
  recommendCheapestFuelRoute,
  type FuelRouteRequest,
  type FuelRouteStationCandidate
} from '@groceryview/core';
import { Card, Eyebrow, PageShell } from '@/components/data-ui';
import { formatFuelPrice, verifiedFuelPriceObservations } from '@/lib/fuel-prices';
import { fuelStations } from '@/lib/ingested/fuel-stations';

const countries = ['se', 'no', 'is'] as const;
type Country = (typeof countries)[number];

type FuelProductId = (typeof verifiedFuelPriceObservations)[number]['productId'];

const countryLabels: Record<Country, string> = {
  se: 'Sweden',
  no: 'Norway',
  is: 'Iceland'
};

const gradeOptions: FuelProductId[] = ['fuel-95-e10', 'fuel-98', 'fuel-diesel', 'fuel-hvo100', 'fuel-e85'];
const defaultGrade: FuelProductId = 'fuel-95-e10';

const stockholm = { latitude: 59.3293, longitude: 18.0686 };
const uppsala = { latitude: 59.8586, longitude: 17.6389 };

function numberParam(value: string | string[] | undefined, fallback: number, min: number, max: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function stringParam(value: string | string[] | undefined, fallback: FuelProductId): FuelProductId {
  const raw = Array.isArray(value) ? value[0] : value;
  return gradeOptions.includes(raw as FuelProductId) ? raw as FuelProductId : fallback;
}

function routeRequestFrom(query: Record<string, string | string[] | undefined>): FuelRouteRequest {
  return {
    origin: {
      latitude: numberParam(query.originLat, stockholm.latitude, 55, 70),
      longitude: numberParam(query.originLon, stockholm.longitude, 10, 25)
    },
    destination: {
      latitude: numberParam(query.destLat, uppsala.latitude, 55, 70),
      longitude: numberParam(query.destLon, uppsala.longitude, 10, 25)
    },
    maxDetourKm: numberParam(query.maxDetourKm, 4, 0, 50),
    litres: numberParam(query.litres, 45, 1, 120),
    detourCostPerKm: numberParam(query.detourCostPerKm, 2.5, 0, 20)
  };
}

function stationAddress(station: (typeof fuelStations)[number]) {
  return [station.street, station.houseNumber, station.postcode, station.city].filter(Boolean).join(', ');
}

function stationCandidates(grade: FuelProductId): FuelRouteStationCandidate[] {
  const price = verifiedFuelPriceObservations.find((row) => row.productId === grade) ?? verifiedFuelPriceObservations[0]!;
  return fuelStations
    .filter((station) => station.chain === 'OKQ8')
    .map((station) => ({
      stationId: `${station.osmType}-${station.osmId}`,
      stationName: stationAddress(station) ? `${station.name} · ${stationAddress(station)}` : station.name,
      chain: station.chain,
      latitude: station.latitude,
      longitude: station.longitude,
      pricePerLitre: price.pricePerLitre,
      fuelGrade: price.label,
      source: `${price.operatorName} operator fuel price page + OpenStreetMap station geometry`,
      sourceConfidence: Math.min(price.confidence, 0.8)
    }));
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 2 }).format(value);
}

export function generateStaticParams() {
  return countries.map((country) => ({ country }));
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  if (!countries.includes(country as Country)) notFound();
  return {
    title: `Fuel route optimizer ${country.toUpperCase()} | GroceryView`,
    description: 'Find the cheapest verified fuel stop near a route with detour cost included.'
  };
}

export default async function FuelRoutePage({
  params,
  searchParams
}: Readonly<{
  params: Promise<{ country: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>) {
  const [{ country }, query] = await Promise.all([params, searchParams]);
  if (!countries.includes(country as Country)) notFound();

  const grade = stringParam(query.grade, defaultGrade);
  const request = routeRequestFrom(query);
  const candidates = stationCandidates(grade);
  const result = recommendCheapestFuelRoute(request, candidates, { limit: 6, minimumConfidence: 0.6 });
  const cheapest = result.cheapest;

  return (
    <PageShell>
      <Eyebrow>{countryLabels[country as Country]} · route fuel finder</Eyebrow>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Cheapest fuel stop near your route</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Enter a current location, destination, fuel volume, and allowed detour. GroceryView combines verified operator fuel prices with OSM station coordinates, then adds detour cost so a cheap pump far off-route does not win unfairly.
      </p>

      <Card className="mt-6 border-emerald-200 bg-emerald-50/70">
        <form className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <label className="text-sm font-black text-slate-700">Origin lat<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.origin.latitude} name="originLat" type="number" step="0.0001" /></label>
          <label className="text-sm font-black text-slate-700">Origin lon<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.origin.longitude} name="originLon" type="number" step="0.0001" /></label>
          <label className="text-sm font-black text-slate-700">Destination lat<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.destination.latitude} name="destLat" type="number" step="0.0001" /></label>
          <label className="text-sm font-black text-slate-700">Destination lon<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.destination.longitude} name="destLon" type="number" step="0.0001" /></label>
          <label className="text-sm font-black text-slate-700">Grade<select className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={grade} name="grade">{gradeOptions.map((option) => <option key={option} value={option}>{option.replace('fuel-', '').toUpperCase()}</option>)}</select></label>
          <button className="rounded-xl bg-emerald-700 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white" type="submit">Find fuel</button>
          <label className="text-sm font-black text-slate-700">Max detour km<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.maxDetourKm} name="maxDetourKm" type="number" step="0.1" /></label>
          <label className="text-sm font-black text-slate-700">Litres<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.litres} name="litres" type="number" step="1" /></label>
          <label className="text-sm font-black text-slate-700">Detour SEK/km<input className="mt-2 w-full rounded-xl border border-emerald-200 px-3 py-2" defaultValue={request.detourCostPerKm} name="detourCostPerKm" type="number" step="0.1" /></label>
        </form>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-4">
        <Card className="border-emerald-200 bg-white">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Best stop</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{cheapest ? cheapest.station.chain : 'None'}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{cheapest ? cheapest.station.stationName : `No station within ${request.maxDetourKm} km detour.`}</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">All-in route cost</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{formatSek(cheapest?.totalCost ?? 0)}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Fuel purchase plus estimated detour cost.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Detour</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{cheapest?.detourKm ?? 0} km</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">Direct route is {result.directDistanceKm} km.</p>
        </Card>
        <Card>
          <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Fuel price</p>
          <p className="mt-2 text-4xl font-black text-slate-950">{cheapest ? formatFuelPrice(cheapest.station.pricePerLitre) : '—'}</p>
          <p className="mt-3 text-sm font-semibold text-slate-700">{cheapest?.station.fuelGrade ?? 'No grade selected'}.</p>
        </Card>
      </div>

      <Card className="mt-6">
        <h2 className="text-2xl font-black">Route-ranked stations</h2>
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-slate-100 text-xs font-black uppercase tracking-[0.18em] text-slate-600">
              <tr><th className="px-4 py-3">Station</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Detour</th><th className="px-4 py-3">Fuel cost</th><th className="px-4 py-3">Detour cost</th><th className="px-4 py-3">Total</th></tr>
            </thead>
            <tbody>
              {result.recommendations.map((row) => (
                <tr className="border-t border-slate-200" key={row.station.stationId}>
                  <td className="px-4 py-3"><p className="font-black text-slate-950">{row.station.stationName}</p><p className="text-xs font-semibold text-slate-600">{row.station.source}</p></td>
                  <td className="px-4 py-3 font-black text-emerald-800">{formatFuelPrice(row.station.pricePerLitre)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{row.detourKm} km</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{formatSek(row.fuelCost)}</td>
                  <td className="px-4 py-3 font-semibold text-slate-700">{formatSek(row.detourCost)}</td>
                  <td className="px-4 py-3 font-black text-slate-950">{formatSek(row.totalCost)}</td>
                </tr>
              ))}
              {result.recommendations.length === 0 ? (
                <tr><td className="px-4 py-5 text-sm font-semibold text-slate-700" colSpan={6}>No verified OKQ8 station is within the requested detour. Increase max detour or change the route.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-black">Detour-cost calculator guardrails</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm font-semibold leading-6 text-slate-700">
          <li>Distance uses haversine geometry: origin → station → destination minus direct origin → destination.</li>
          <li>All-in total = litres × verified operator kr/l + detour km × shopper SEK/km.</li>
          <li>Station locations are OSM amenity=fuel rows; station-level pump prices are limited to operator-grade prices until live station reports land.</li>
        </ul>
      </Card>
    </PageShell>
  );
}
