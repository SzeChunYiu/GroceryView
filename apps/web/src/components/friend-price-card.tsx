import type { FriendPriceSighting } from '@/lib/social';

type FriendPriceCardProps = {
  sighting: FriendPriceSighting;
};

export function FriendPriceCard({ sighting }: FriendPriceCardProps) {
  return (
    <div className="rounded-2xl border border-fuchsia-100 bg-white/90 p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-800">{sighting.reporter}</p>
      <h3 className="mt-2 text-lg font-black text-slate-950">{sighting.storeName}</h3>
      <p className="mt-2 text-3xl font-black text-emerald-800">{sighting.priceLabel}</p>
      <p className="mt-2 text-sm font-semibold text-slate-600">Observed {sighting.observedAt.slice(0, 10)} · {sighting.confidence} confidence</p>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
        Shared with permission by an anonymized friend or household member for this product and chain.
      </p>
    </div>
  );
}
