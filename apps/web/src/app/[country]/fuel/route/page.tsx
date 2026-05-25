import { rankCheapestFuelStationsByRoute, type FuelRouteStation } from '@groceryview/core';
import { Card, DashboardHero, Eyebrow, PageShell, StatusBadge } from '@/components/data-ui';
import { formatFuelPrice, verifiedFuelPriceObservations } from '@/lib/fuel-prices';
import { fuelStations } from '@/lib/ingested/fuel-stations';
import { routeMetadata } from '@/lib/seo';

const origin = { latitude: 59.3293, longitude: 18.0686, label: 'Stockholm current location' };
const destination = { latitude: 57.7089, longitude: 11.9746, label: 'Gothenburg destination' };
const petrol95 = verifiedFuelPriceObservations.find((row) => row.grade === '95')!;
const detourCostPerKm = 2.4;
const fuelNeededLitres = 45;
const maxDetourKm = 18;

function formatKm(value: number) {
  return `${value.toLocaleString('sv-SE', { maximumFractionDigits: 1 })} km`;
}

function formatSek(value: number) {
  return new Intl.NumberFormat('sv-SE', { currency: 'SEK', maximumFractionDigits: 0, style: 'currency' }).format(value);
}

const stationCandidates: FuelRouteStation[] = fuelStations
  .filter((station) => station.chain === 'OKQ8')
  .map((station) => ({
    id: `${station.osmType}-${station.osmId}`,
    chain: station.chain,
    name: station.name || station.chain,
    latitude: station.latitude,
    longitude: station.longitude,
    pricePerLitre: petrol95.pricePerLitre
  }));

const recommendations = rankCheapestFuelStationsByRoute({
  destination,
  detourCostPerKm,
  fuelNeededLitres,
  maxDetourKm,
  origin,
  stations: stationCandidates
}).slice(0, 8);

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  return routeMetadata({
    path: `/${country}/fuel/route`,
    title: 'Cheapest fuel near route | GroceryView',
    description: 'Fuel station route suggestions ranked by fuel price plus detour cost.'
  });
}

export default async function FuelRoutePage({ params }: Readonly<{ params: Promise<{ country: string }> }>) {
  const { country } = await params;
  const best = recommendations[0];

  return (
    <PageShell>
      <DashboardHero
        actions={
          <>
            <StatusBadge tone="success">{country.toUpperCase()} route</StatusBadge>
            <StatusBadge tone="warning">Detour capped</StatusBadge>
          </>
        }
        eyebrow="Cheapest fuel near me by route"
        title="Cheapest fuel stop within a route detour"
      >
        <p>
          This route ranks verified fuel stations by pump price plus the cost of leaving the current route. The demo uses {origin.label} to {destination.label}, {fuelNeededLitres} litres of 95 E10, and an {formatKm(maxDetourKm)} detour cap.
        </p>
      </DashboardHero>

      <section className="mt-6 grid gap-4 md:grid-cols-3" aria-label="Fuel route summary">
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Best station</p>
          <p className="mt-2 text-2xl font-black text-slate-950">{best?.name ?? 'No station inside cap'}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{best ? `${best.chain} · ${formatKm(best.detourKm)} detour` : 'Increase the detour radius'}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Verified fuel price</p>
          <p className="mt-2 text-3xl font-black text-emerald-800">{formatFuelPrice(petrol95.pricePerLitre)}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">{petrol95.operatorName} {petrol95.label}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-black text-slate-600">Detour cost model</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{formatSek(detourCostPerKm)}/km</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">extra distance × cost per km</p>
        </Card>
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <Eyebrow>Ranked route stops</Eyebrow>
            <h2 className="mt-2 text-2xl font-black">Cheapest eligible stations</h2>
          </div>
          <p className="text-sm font-bold text-slate-600">Direct route: {best ? formatKm(best.directRouteKm) : 'unknown'}</p>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-slate-950 text-white">
              <tr>
                <th className="px-4 py-3">Station</th>
                <th className="px-4 py-3">Fuel</th>
                <th className="px-4 py-3">Detour</th>
                <th className="px-4 py-3">Detour cost</th>
                <th className="px-4 py-3">Total trip fuel cost</th>
              </tr>
            </thead>
            <tbody>
              {recommendations.map((station) => (
                <tr className="border-t border-slate-100" key={station.id}>
                  <td className="px-4 py-4 font-black text-slate-950">{station.name}</td>
                  <td className="px-4 py-4 font-semibold text-emerald-800">{formatFuelPrice(station.pricePerLitre)} · {formatSek(station.fuelCost)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatKm(station.detourKm)}</td>
                  <td className="px-4 py-4 font-semibold text-slate-700">{formatSek(station.detourCost)}</td>
                  <td className="px-4 py-4 text-lg font-black text-slate-950">{formatSek(station.totalTripCost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <Eyebrow>Calculator guardrail</Eyebrow>
        <p className="mt-2 text-sm font-semibold leading-6 text-amber-950">
          The recommendation only uses stations with a verified operator price for the selected grade. It does not infer live pump inventory, traffic, or unavailable grades; those need station-level evidence before routing a driver.
        </p>
      </Card>
    </PageShell>
  );
}
