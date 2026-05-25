import { Card } from '@/components/data-ui';
import { FriendPriceCard } from '@/components/friend-price-card';
import type { FriendPriceSighting } from '@/lib/social';

type FriendPriceSightingsProps = {
  sightings: FriendPriceSighting[];
};

export function FriendPriceSightings({ sightings }: FriendPriceSightingsProps) {
  if (sightings.length === 0) return null;

  return (
    <Card className="mt-6 border-fuchsia-200 bg-fuchsia-50/70">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-fuchsia-800">Friend price sightings</p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">Anonymized friend and household prices</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-700">
            Shows permissioned social sightings for this exact product with a store, price, observation date, and optional note. Private names and unshared sightings stay hidden.
          </p>
        </div>
        <p className="rounded-full bg-white px-4 py-2 text-sm font-black text-fuchsia-900">{sightings.length} shared sighting(s)</p>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {sightings.map((sighting) => (
          <FriendPriceCard key={sighting.id} sighting={sighting} />
        ))}
      </div>
    </Card>
  );
}
