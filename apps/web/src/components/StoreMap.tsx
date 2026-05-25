import { googleMapsDirectionsUrl, googleMapsEmbedUrl, type StoreMapLocation } from '@/lib/mapsConfig';

export type StoreMapServiceBadge = {
  key: string;
  label: string;
  available: boolean;
};

export function StoreMap({ store, serviceBadges = [] }: Readonly<{ store: StoreMapLocation; serviceBadges?: readonly StoreMapServiceBadge[] }>) {
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
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Pin: {store.name} · {store.lat.toFixed(5)}, {store.lng.toFixed(5)}
          </p>
          {serviceBadges.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {serviceBadges.map((badge) => (
                <span
                  className={badge.available
                    ? 'rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800'
                    : 'rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600'}
                  key={badge.key}
                >
                  {badge.label}: {badge.available ? 'available' : 'source gap'}
                </span>
              ))}
            </div>
          ) : null}
        </div>
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
