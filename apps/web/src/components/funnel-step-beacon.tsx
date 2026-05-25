'use client';

import { useEffect } from 'react';
import { trackSearchToSavingsFunnelStep, type SearchToSavingsFunnelStepId } from '@/lib/analytics';

export function FunnelStepBeacon({ step }: Readonly<{ step: SearchToSavingsFunnelStepId }>) {
  useEffect(() => {
    trackSearchToSavingsFunnelStep(step);
  }, [step]);

  return null;
}
