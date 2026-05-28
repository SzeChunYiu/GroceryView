import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card, Eyebrow, PageShell, SourceCitation } from '@/components/data-ui';
import { fuelStations, fuelStationSource } from '@/lib/ingested/fuel-stations';
import { routeMetadata } from '@/lib/seo';

function findStation(stationId: string) {
  return fuelStations.find((station) => String(station.osmId) === stationId);
}

function stationAddress(station: (typeof fuelStations)[number]) {
  return [station.street, station.houseNumber, station.postcode, station.city].filter(Boolean).join(', ');
}

function stationSupportedGrades(station: (typeof fuelStations)[number]) {
  return station.supportedGradeIds?.length ? station.supportedGradeIds.join(', ') : 'Grade support not tagged';
}

export async function generateMetadata({ params }: Readonly<{ params: Promise<{ stationId: string }> }>) {
  const { stationId } = await params;
  const station = findStation(stationId);
  return routeMetadata({
    path: `/fuel/stations/${stationId}`,
    canonicalPath: station ? `/fuel/stations/${station.osmId}` : '/fuel/stations',
    title: station ? `${station.name} fuel station evidence | GroceryView` : 'Fuel station evidence | GroceryView',
    description: 'Inspect source-backed OSM and Overpass fuel station location details with no station-specific pump price claim unless source evidence exists.',
    noIndex: !station
  });
}

export default async function FuelStationDetailPage({ params }: Readonly<{ params: Promise<{ stationId: string }> }>) {
  const { stationId } = await params;
  const station = findStation(stationId);
  if (!station) notFound();

  return (
    <PageShell>
      <Eyebrow>Fuel station detail</Eyebrow>
      <p className="mt-3 text-sm font-black text-emerald-900">What evidence exists for this fuel station location?</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">{station.name}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Station locations are from OSM/Overpass. No station-specific pump price is shown here; operator-level fuel prices remain separate unless station-level evidence exists.
      </p>
      <div className="mt-4">
        <SourceCitation
          confidenceLabel="Location evidence only; no station-specific pump price"
          connectorRun="Overpass amenity=fuel station extract"
          href={station.sourceUrl || fuelStationSource.sourceUrl}
          observedAt={station.retrievedAt}
          sourceLabel="Station locations are from OSM/Overpass"
        />
      </div>

      <Card className="mt-6 border-amber-200 bg-amber-50">
        <h2 className="text-2xl font-black text-amber-950">Station claim boundary</h2>
        <dl className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl bg-white/80 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Chain</dt>
            <dd className="mt-2 font-black text-amber-950">{station.chain}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Address</dt>
            <dd className="mt-2 font-black text-amber-950">{stationAddress(station) || 'Address not tagged'}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Supported grades</dt>
            <dd className="mt-2 font-black text-amber-950">{stationSupportedGrades(station)}</dd>
          </div>
          <div className="rounded-2xl bg-white/80 p-4">
            <dt className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">Coordinates</dt>
            <dd className="mt-2 font-black text-amber-950">{station.latitude.toFixed(5)}, {station.longitude.toFixed(5)}</dd>
          </div>
        </dl>
        <p className="mt-4 rounded-2xl bg-white/80 p-4 text-sm font-bold leading-6 text-amber-950">
          No station-specific pump price appears without station-level source evidence. Compare operator-level prices on the main fuel page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link className="rounded-full bg-amber-900 px-4 py-2 text-sm font-black text-white" href="/fuel">Compare operator fuel prices</Link>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-black text-amber-950" href="/fuel/stations">Back to station list</Link>
        </div>
      </Card>
    </PageShell>
  );
}
