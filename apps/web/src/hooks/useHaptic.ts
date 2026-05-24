'use client';

import { useCallback } from 'react';

type HapticPattern = number | number[];

function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

export function useHaptic() {
  const vibrate = useCallback((pattern: HapticPattern = 12) => {
    if (!canVibrate()) return false;
    return navigator.vibrate(pattern);
  }, []);

  return {
    selection: () => vibrate(12),
    success: () => vibrate([16, 24, 16]),
    vibrate,
  };
}
