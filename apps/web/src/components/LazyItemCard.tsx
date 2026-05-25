'use client';

import Link from 'next/link';
import { useEffect, useRef, type ReactNode } from 'react';
import { trackItemCardImpression } from '@/lib/analytics';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export type LazyItemCardProps = {
  aboveFold?: boolean;
  children: ReactNode;
  className: string;
  compareMode: string;
  href: string;
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
};

export function LazyItemCard({
  aboveFold = false,
  children,
  className,
  compareMode,
  href,
  itemId,
  itemName,
  listId,
  listIndex
}: Readonly<LazyItemCardProps>) {
  const hasTrackedImpression = useRef(false);
  const { isIntersecting, ref } = useIntersectionObserver<HTMLAnchorElement>({
    freezeOnceVisible: true,
    rootMargin: '120px 0px',
    threshold: 0.4
  });

  useEffect(() => {
    if (!isIntersecting || hasTrackedImpression.current) return;
    hasTrackedImpression.current = true;
    trackItemCardImpression({ compareMode, itemId, itemName, listId, listIndex });
  }, [compareMode, isIntersecting, itemId, itemName, listId, listIndex]);

  return (
    <Link
      className={className}
      data-analytics-item-id={itemId}
      data-analytics-list-id={listId}
      data-image-loading={aboveFold ? 'eager' : 'lazy'}
      href={href}
      ref={ref}
    >
      {children}
    </Link>
  );
}
