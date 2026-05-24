'use client';

import { type KeyboardEvent } from 'react';

type ChainSelectorOption = {
  id: string;
  name: string;
  description?: string;
};

type ChainSelectorProps = {
  chains: ChainSelectorOption[];
  selectedChainId?: string;
  onSelect: (chainId: string) => void;
  label?: string;
};

const activationKeys = new Set(['Enter', ' ']);

export function ChainSelector({ chains, selectedChainId, onSelect, label = 'Select grocery chain' }: ChainSelectorProps) {
  const activateWithKeyboard = (event: KeyboardEvent<HTMLDivElement>, chainId: string) => {
    if (!activationKeys.has(event.key)) {
      return;
    }

    event.preventDefault();
    onSelect(chainId);
  };

  return (
    <div aria-label={label} className="grid gap-3" role="radiogroup">
      {chains.map((chain) => {
        const isSelected = chain.id === selectedChainId;

        return (
          <div
            aria-checked={isSelected}
            aria-label={chain.name}
            className={`rounded-xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-mint ${
              isSelected ? 'border-market-mint bg-market-mint/10' : 'border-market-ink/15 bg-white hover:bg-market-oat'
            }`}
            key={chain.id}
            onClick={() => onSelect(chain.id)}
            onKeyDown={(event) => activateWithKeyboard(event, chain.id)}
            role="radio"
            tabIndex={0}
          >
            <span className="block text-sm font-semibold text-market-ink">{chain.name}</span>
            {chain.description ? <span className="mt-1 block text-xs text-market-ink/70">{chain.description}</span> : null}
          </div>
        );
      })}
    </div>
  );
}
