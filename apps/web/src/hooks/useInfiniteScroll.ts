"use client";

import { useCallback, useEffect, useRef } from 'react';

export type UseInfiniteScrollOptions = {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  enabled?: boolean;
  rootMargin?: string;
  threshold?: number;
};

export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  isLoading,
  enabled = true,
  rootMargin = '200px',
  threshold = 0.1
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const resetObserver = useCallback(() => {
    if (!observerRef.current) return;
    observerRef.current.disconnect();
    observerRef.current = null;
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!enabled || !node || !hasMore || isLoading) {
      resetObserver();
      return;
    }

    resetObserver();
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMore();
        }
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    observer.observe(node);
    observerRef.current = observer;

    return () => {
      observer.disconnect();
      observerRef.current = null;
    };
  }, [enabled, hasMore, isLoading, onLoadMore, rootMargin, resetObserver, threshold]);

  useEffect(() => {
    return () => {
      resetObserver();
    };
  }, [resetObserver]);

  return sentinelRef;
}
