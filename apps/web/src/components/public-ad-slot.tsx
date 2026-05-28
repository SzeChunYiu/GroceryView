'use client';

import { usePathname } from 'next/navigation';
import { AdSlot } from '@/components/design-system';
import { slotAllowedOnRoute } from '@/lib/ad-policy';
import type { AdSlotId } from '@/lib/ad-slots';
import { AD_SLOT_MIN_HEIGHT_PX } from '@/lib/ad-slots';

type PublicAdSlotProps = Readonly<{
  slotId: AdSlotId;
  className?: string;
}>;

/** Policy-gated ad placement for public routes only. */
export function PublicAdSlot({ slotId, className }: PublicAdSlotProps) {
  const pathname = usePathname() ?? '/';
  if (!slotAllowedOnRoute(slotId, pathname)) return null;

  return <AdSlot className={className} label="Advertisement" minHeight={AD_SLOT_MIN_HEIGHT_PX} />;
}
