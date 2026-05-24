'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getProductImageFallback } from '@/lib/imageFallback';

type ItemCardProps = Readonly<{
  title: string;
  imageUrl?: string | null;
  subtitle?: string;
  category?: string;
  categoryLabel?: string;
  primaryMetric?: string;
  footer?: ReactNode;
  className?: string;
}>;

export function ItemCard({
  title,
  imageUrl,
  subtitle,
  category,
  categoryLabel,
  primaryMetric,
  footer,
  className = '',
}: ItemCardProps) {
  const fallbackImage = useMemo(
    () => getProductImageFallback({ category, label: categoryLabel || title }),
    [category, categoryLabel, title]
  );
  const [currentSrc, setCurrentSrc] = useState<string>(imageUrl?.trim() || fallbackImage);
  const [isFallback, setIsFallback] = useState<boolean>(!imageUrl?.trim());

  const handleImageError = useCallback(() => {
    if (isFallback) return;
    setCurrentSrc(fallbackImage);
    setIsFallback(true);
  }, [fallbackImage, isFallback]);

  return (
    <article className={`flex gap-3 rounded-lg border border-market-ink/10 bg-white p-3 ${className}`}>
      <img
        src={currentSrc}
        alt={title}
        onError={handleImageError}
        className="h-20 w-20 shrink-0 rounded-md border border-market-ink/10 object-cover"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="min-w-0">
        <h3 className="font-semibold text-market-ink">{title}</h3>
        {primaryMetric ? <p className="mt-1 text-lg font-black text-market-mint">{primaryMetric}</p> : null}
        {subtitle ? <p className="mt-1 text-sm text-market-ink/65">{subtitle}</p> : null}
        {footer ? <div className="mt-2 text-sm">{footer}</div> : null}
      </div>
    </article>
  );
}
