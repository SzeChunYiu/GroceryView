'use client';

import { useMemo } from 'react';

type ChainFilterInputProps = {
  chains: string[];
  products: string;
};

export function ChainFilterInput({ chains, products }: ChainFilterInputProps) {
  const chainFilterValue = useMemo(() => chains.join(','), [chains, products]);

  if (chains.length === 0) return null;

  return <input name="chain" type="hidden" value={chainFilterValue} />;
}
