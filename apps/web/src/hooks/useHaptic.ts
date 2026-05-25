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
    duplicate: () => vibrate([8, 24, 8]),
    error: () => vibrate([28, 32, 28]),
    impact: () => vibrate([10, 18, 10]),
    selection: () => vibrate(12),
    success: () => vibrate([16, 24, 16]),
    vibrate,
  };
}
