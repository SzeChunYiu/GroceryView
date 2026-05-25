'use client';

import Link from 'next/link';
import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import { trackItemCardImpression } from '@/lib/analytics';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

export type LazyItemCardProps = {
  children: ReactNode;
  className: string;
  compareMode: string;
  href: string;
  itemId: string;
  itemName: string;
  listId: string;
  listIndex: number;
  style?: CSSProperties;
};

export function LazyItemCard({
  children,
  className,
  compareMode,
  href,
  itemId,
  itemName,
  listId,
  listIndex,
  style
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
      href={href}
      ref={ref}
      style={{ contentVisibility: 'auto', containIntrinsicSize: '320px', ...style }}
    >
      {children}
    </Link>
  );
}
