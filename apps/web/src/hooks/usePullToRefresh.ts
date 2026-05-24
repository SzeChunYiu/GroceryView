'use client';

import { useCallback, useRef, useState } from 'react';
import type { TouchEvent } from 'react';

type UsePullToRefreshOptions = {
  disabled?: boolean;
  maxPullDistance?: number;
  onRefresh: () => Promise<void> | void;
  threshold?: number;
};

export type PullToRefreshStatus = 'idle' | 'pulling' | 'ready' | 'refreshing' | 'complete' | 'error';

export function usePullToRefresh({
  disabled = false,
  maxPullDistance = 112,
  onRefresh,
  threshold = 72
}: UsePullToRefreshOptions) {
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [status, setStatus] = useState<PullToRefreshStatus>('idle');

  const reset = useCallback(() => {
    startYRef.current = null;
    setPullDistance(0);
    setStatus('idle');
  }, []);

  const refresh = useCallback(async () => {
    if (disabled || status === 'refreshing') return;
    setStatus('refreshing');
    try {
      await onRefresh();
      setStatus('complete');
      window.setTimeout(reset, 900);
    } catch {
      setStatus('error');
      window.setTimeout(reset, 1400);
    }
  }, [disabled, onRefresh, reset, status]);

  const onTouchStart = useCallback((event: TouchEvent) => {
    if (disabled || status === 'refreshing' || window.scrollY > 0) return;
    startYRef.current = event.touches[0]?.clientY ?? null;
  }, [disabled, status]);

  const onTouchMove = useCallback((event: TouchEvent) => {
    if (disabled || status === 'refreshing' || startYRef.current === null) return;
    const currentY = event.touches[0]?.clientY;
    if (currentY === undefined) return;

    const distance = Math.max(0, currentY - startYRef.current);
    if (distance <= 0) return;

    event.preventDefault();
    const dampenedDistance = Math.min(maxPullDistance, Math.round(distance * 0.55));
    setPullDistance(dampenedDistance);
    setStatus(dampenedDistance >= threshold ? 'ready' : 'pulling');
  }, [disabled, maxPullDistance, status, threshold]);

  const onTouchEnd = useCallback(() => {
    if (disabled || status === 'refreshing') return;
    const shouldRefresh = pullDistance >= threshold;
    startYRef.current = null;
    setPullDistance(0);
    if (shouldRefresh) void refresh();
    else setStatus('idle');
  }, [disabled, pullDistance, refresh, status, threshold]);

  return {
    handlers: {
      onTouchEnd,
      onTouchMove,
      onTouchStart
    },
    isRefreshing: status === 'refreshing',
    pullDistance,
    refresh,
    status
  };
}
