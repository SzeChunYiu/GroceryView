import Link from 'next/link';
import { Card, Eyebrow, PageShell, SourceCitation } from '@/components/data-ui';
import { fuelStations, fuelStationSource } from '@/lib/ingested/fuel-stations';
import { routeMetadata } from '@/lib/seo';

function stationAddress(station: (typeof fuelStations)[number]) {
  return [station.street, station.houseNumber, station.postcode, station.city].filter(Boolean).join(', ');
}

function stationSupportedGrades(station: (typeof fuelStations)[number]) {
  return station.supportedGradeIds?.length ? station.supportedGradeIds.join(', ') : 'Grade support not tagged';
}

export function generateMetadata() {
  return routeMetadata({
    path: '/fuel/stations',
    canonicalPath: '/fuel/stations',
    title: 'Fuel station location evidence | GroceryView',
    description: 'Browse source-backed OSM and Overpass fuel station locations with operator-level price guardrails and no station pump price inference.'
  });
}

export default function FuelStationsPage() {
  const visibleStations = fuelStations.slice(0, 120);

  return (
    <PageShell>
      <Eyebrow>Fuel station evidence</Eyebrow>
      <p className="mt-3 text-sm font-black text-emerald-900">Where can I inspect source-backed fuel station locations?</p>
      <h1 className="mt-2 text-4xl font-black tracking-tight">Fuel station locations</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-700">
        Station locations are from OSM/Overpass. Operator-level price, not station-specific pump price, is the default claim boundary unless a station-specific source is present.
      </p>
      <div className="mt-4">
        <SourceCitation
          confidenceLabel={`${fuelStationSource.rowCount} OSM station rows; no station-specific pump price claim`}
          connectorRun="Overpass amenity=fuel station extract"
          href={fuelStationSource.sourceUrl}
          observedAt={fuelStationSource.retrievedAt}
          sourceLabel="Station locations are from OSM/Overpass"
        />
      </div>

      <Card className="mt-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleStations.map((station) => (
            <Link
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:ring-2 hover:ring-emerald-200"
              href={`/fuel/stations/${station.osmId}`}
              key={`${station.osmType}-${station.osmId}`}
            >
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{station.chain} · OSM {station.osmType}/{station.osmId}</p>
              <h2 className="mt-2 text-lg font-black text-slate-950">{station.name}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{stationAddress(station) || 'Address not tagged'}</p>
              <p className="mt-2 rounded-xl bg-slate-50 p-3 text-xs font-bold leading-5 text-slate-600">{stationSupportedGrades(station)}</p>
              <p className="mt-3 text-xs font-black text-amber-800">Operator-level price, not station-specific pump price.</p>
            </Link>
          ))}
        </div>
      </Card>
    </PageShell>
  );
}
