export type StoreMapLocation = {
  name: string;
  address?: string | null;
  lat: number;
  lng: number;
};

function storeMapQuery(location: StoreMapLocation) {
  return [location.name, location.address, `${location.lat},${location.lng}`]
    .filter(Boolean)
    .join(' ');
}

export function googleMapsEmbedUrl(location: StoreMapLocation) {
  const query = encodeURIComponent(storeMapQuery(location));
  return `https://www.google.com/maps?q=${query}&z=16&output=embed`;
}

export function googleMapsDirectionsUrl(location: StoreMapLocation) {
  const destination = encodeURIComponent(`${location.lat},${location.lng}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
}
