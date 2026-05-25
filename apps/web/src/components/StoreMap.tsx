import { googleMapsDirectionsUrl, googleMapsEmbedUrl, type StoreMapLocation } from '@/lib/mapsConfig';
import type { StoreDistanceRow } from '@/lib/store-distance';

type StoreMapProps = {
  store: StoreMapLocation;
  routeRecommendation?: Pick<StoreDistanceRow, 'basketTotalSek' | 'openingStatusLabel' | 'recommendationLabel' | 'routeScore' | 'totalMinutes' | 'travelCostSek'>;
};

export function StoreMap({ store, routeRecommendation }: Readonly<StoreMapProps>) {
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
      {routeRecommendation ? (
        <div className="border-t border-slate-100 bg-cyan-50 p-4" data-store-detail-route-aware-recommendation="true">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-800">Route-aware store recommendation</p>
          <p className="mt-2 text-sm font-semibold leading-6 text-cyan-950">
            Score {routeRecommendation.routeScore.toFixed(0)} combines route time ({routeRecommendation.totalMinutes} min),
            basket cost ({routeRecommendation.basketTotalSek.toFixed(2)} SEK), trip cost ({routeRecommendation.travelCostSek.toFixed(1)} SEK),
            and opening status ({routeRecommendation.openingStatusLabel}).
          </p>
          <p className="mt-1 text-xs font-semibold text-cyan-900">{routeRecommendation.recommendationLabel}</p>
        </div>
      ) : null}
    </div>
  );
}
