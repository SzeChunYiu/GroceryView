'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type UseIntersectionObserverOptions = IntersectionObserverInit & {
  freezeOnceVisible?: boolean;
};

export function useIntersectionObserver<TElement extends Element>({
  freezeOnceVisible = false,
  root = null,
  rootMargin = '0px',
  threshold = 0
}: UseIntersectionObserverOptions = {}) {
  const targetRef = useRef<TElement | null>(null);
  const [targetNode, setTargetNode] = useState<TElement | null>(null);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const frozen = freezeOnceVisible && entry?.isIntersecting;

  useEffect(() => {
    const target = targetNode;
    if (!target || frozen || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver(([nextEntry]) => {
      if (nextEntry) setEntry(nextEntry);
    }, { root, rootMargin, threshold });

    observer.observe(target);
    return () => observer.disconnect();
  }, [frozen, root, rootMargin, targetNode, threshold]);

  const ref = useCallback((node: TElement | null) => {
    targetRef.current = node;
    setTargetNode(node);
  }, []);

  return { entry, isIntersecting: Boolean(entry?.isIntersecting), ref };
}
