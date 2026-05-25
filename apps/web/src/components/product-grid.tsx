'use client';

import { useEffect, useMemo, useState } from 'react';
import { VirtualizedProductGrid, type VirtualizedProduct } from './LazyItemCard';

const DEFAULT_INITIAL_RESULT_COUNT = 18;

export function ProductGrid({
  initialResultCount = DEFAULT_INITIAL_RESULT_COUNT,
  products,
  resultLabel
}: Readonly<{
  initialResultCount?: number;
  products: VirtualizedProduct[];
  resultLabel: string;
}>) {
  const initialProducts = useMemo(
    () => products.slice(0, Math.max(1, Math.min(initialResultCount, products.length))),
    [initialResultCount, products]
  );
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    setIsComplete(false);
    const frame = window.requestAnimationFrame(() => setIsComplete(true));
    return () => window.cancelAnimationFrame(frame);
  }, [products]);

  return (
    <div data-incremental-search-results={isComplete ? 'complete' : 'partial'}>
      <VirtualizedProductGrid
        products={isComplete ? products : initialProducts}
        resultLabel={isComplete ? resultLabel : `${resultLabel}, partial results`}
      />
    </div>
  );
}
