'use client';

import { StorePreviewCard } from '@/components/preview/store-preview-card';
import { PublicAdSlot } from '@/components/public-ad-slot';
import type { FreshnessLabel, VerifiedEvidence } from '@/lib/mvp/types';

export type MapNearbyStorePreviewInput = Readonly<{
  id: string;
  storeName: string;
  chainName: string;
  basketTotalSek: number;
  areaLabel: string;
}>;

type MapNearbyStorePreviewsProps = Readonly<{
  stores: MapNearbyStorePreviewInput[];
}>;

function storeEvidence(store: MapNearbyStorePreviewInput): VerifiedEvidence {
  return {
    sourceLabel: 'Verified store basket sample',
    lastObservedAt: new Date().toISOString(),
    freshnessLabel: 'fresh' satisfies FreshnessLabel,
    confidence: 0.7,
    confidenceLabel: 'medium',
    observationCount: 1
  };
}

export function MapNearbyStorePreviews({ stores }: MapNearbyStorePreviewsProps) {
  return (
    <>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {stores.map((store) => (
          <StorePreviewCard
            chainLabel={store.chainName}
            evidence={storeEvidence(store)}
            key={store.id}
            lowestPrice={store.basketTotalSek}
            storeName={store.storeName}
            storeSlug={store.id}
          />
        ))}
      </div>
      {stores.length > 0 ? (
        <div className="mt-6">
          <PublicAdSlot slotId="map_bottom" />
        </div>
      ) : null}
    </>
  );
}
