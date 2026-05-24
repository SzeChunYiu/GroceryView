'use client';

import { type KeyboardEvent, useId } from 'react';

type ChainSelectorOption = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type ChainSelectorProps = {
  chains: ChainSelectorOption[];
  selectedChainId: string;
  onSelect: (chainId: string) => void;
  label?: string;
  description?: string;
  statusMessage?: string;
};

function activateFromKeyboard(event: KeyboardEvent<HTMLButtonElement>, callback: () => void) {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  event.preventDefault();
  callback();
}

export function ChainSelector({
  chains,
  selectedChainId,
  onSelect,
  label = 'Choose grocery chain',
  description = 'Select one chain to update the comparison view.',
  statusMessage
}: ChainSelectorProps) {
  const componentId = useId();
  const descriptionId = `${componentId}-chain-selector-description`;
  const statusId = `${componentId}-chain-selector-status`;

  return (
    <section aria-label={label} aria-describedby={`${descriptionId} ${statusId}`} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-950">{label}</h2>
          <p className="text-sm font-semibold leading-6 text-slate-600" id={descriptionId}>{description}</p>
        </div>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
          {chains.length.toLocaleString('sv-SE')} chain{chains.length === 1 ? '' : 's'}
        </p>
      </div>

      <div aria-label="Available chains" aria-describedby={descriptionId} className="mt-4 flex flex-wrap gap-2" role="radiogroup">
        {chains.map((chain) => {
          const selected = chain.id === selectedChainId;
          const selectChain = () => {
            if (!chain.disabled) onSelect(chain.id);
          };

          return (
            <button
              aria-checked={selected}
              aria-describedby={chain.description ? `${descriptionId} ${componentId}-chain-selector-${chain.id}-description` : descriptionId}
              aria-label={`Select ${chain.label}`}
              className={`rounded-full px-4 py-2 text-sm font-black transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 ${selected ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-800 hover:bg-emerald-50'}`}
              disabled={chain.disabled}
              key={chain.id}
              onClick={selectChain}
              onKeyDown={(event) => activateFromKeyboard(event, selectChain)}
              role="radio"
              type="button"
            >
              {chain.label}
              {chain.description ? <span className="sr-only" id={`${componentId}-chain-selector-${chain.id}-description`}>{chain.description}</span> : null}
            </button>
          );
        })}
      </div>

      <p className="sr-only" id={statusId} role="status" aria-live="polite" aria-atomic="true">
        {statusMessage ?? `Selected chain: ${chains.find((chain) => chain.id === selectedChainId)?.label ?? 'none'}.`}
      </p>
    </section>
  );
}
