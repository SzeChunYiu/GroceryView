import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SearchStore = {
  slug: string;
  name: string;
  district: string;
  lat: number;
  lng: number;
};

const defaultStoreSuggestions: SearchStore[] = [
  { slug: 'willys-odenplan', name: 'Willys Odenplan', district: 'Vasastan', lat: 59.343, lng: 18.049 },
  { slug: 'ica-nara-sergels-torg', name: 'ICA Nära Sergels Torg', district: 'Norrmalm', lat: 59.332, lng: 18.064 },
  { slug: 'coop-swedenborgsgatan', name: 'Coop Swedenborgsgatan', district: 'Södermalm', lat: 59.316, lng: 18.064 },
  { slug: 'lidl-sveavagen', name: 'Lidl Sveavägen', district: 'Vasastan', lat: 59.346, lng: 18.059 },
];

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const radiusKm = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) * Math.cos((to.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() ?? '';
  const lat = Number(request.nextUrl.searchParams.get('lat'));
  const lng = Number(request.nextUrl.searchParams.get('lng'));
  const hasLocation = Number.isFinite(lat) && Number.isFinite(lng);

  const stores = defaultStoreSuggestions
    .filter((store) => !query || `${store.name} ${store.district}`.toLowerCase().includes(query))
    .map((store) => ({
      ...store,
      distanceKm: hasLocation ? Number(distanceKm({ lat, lng }, store).toFixed(2)) : null,
      locationRanked: hasLocation,
    }))
    .sort((a, b) => {
      if (!hasLocation) return a.name.localeCompare(b.name);
      return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
    });

  return NextResponse.json({
    query,
    location: hasLocation ? { lat, lng } : null,
    defaultStoreSuggestions: stores,
    results: stores.map((store) => ({
      type: 'store',
      label: store.name,
      slug: store.slug,
      district: store.district,
      distanceKm: store.distanceKm,
    })),
  });
}
