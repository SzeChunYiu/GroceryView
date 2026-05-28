'use client';

import { DealPreviewCard } from '@/components/preview/deal-preview-card';
import { PublicAdSlot } from '@/components/public-ad-slot';
import type { DealEvaluation } from '@/lib/mvp/types';

type DealFeedWithPreviewsProps = Readonly<{
  deals: DealEvaluation[];
}>;

export function DealFeedWithPreviews({ deals }: DealFeedWithPreviewsProps) {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-2">
        {deals.map((deal) => (
          <DealPreviewCard deal={deal} key={deal.id} />
        ))}
      </div>
      {deals.length > 0 ? (
        <div className="mt-6">
          <PublicAdSlot slotId="deals_bottom" />
        </div>
      ) : null}
    </>
  );
}
