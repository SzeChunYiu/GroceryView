import { googleMapsDirectionsUrl, googleMapsEmbedUrl, type StoreMapLocation } from '@/lib/mapsConfig';

export function StoreMap({ store }: Readonly<{ store: StoreMapLocation }>) {
  const embedUrl = googleMapsEmbedUrl(store);
  const directionsUrl = googleMapsDirectionsUrl(store);

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <iframe
        allowFullScreen
        className="h-80 w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
        title={`Google Maps location for ${store.name}`}
      />
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-slate-700">
          Pin: {store.name} · {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
        </p>
        <a
          className="inline-flex rounded-full bg-emerald-700 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-800"
          href={directionsUrl}
          rel="noreferrer"
          target="_blank"
        >
          Open Google Maps directions
        </a>
      </div>
    </div>
  );
}
