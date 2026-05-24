'use client';

import { useId, useMemo, useState } from 'react';

export type ChainSelectorOption = {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
};

type ChainSelectorProps = {
  label: string;
  helperText: string;
  options: ChainSelectorOption[];
  defaultValue?: string;
  onChange?: (chainId: string) => void;
};

export function ChainSelector({ label, helperText, options, defaultValue, onChange }: ChainSelectorProps) {
  const generatedId = useId();
  const initialValue = defaultValue ?? options.find((option) => !option.disabled)?.id ?? '';
  const [selectedChainId, setSelectedChainId] = useState(initialValue);
  const selectedChain = useMemo(
    () => options.find((option) => option.id === selectedChainId),
    [options, selectedChainId]
  );
  const helperId = `${generatedId}-helper`;
  const statusId = `${generatedId}-status`;

  return (
    <fieldset aria-describedby={`${helperId} ${statusId}`} className="space-y-3">
      <legend className="text-sm font-semibold text-slate-950">{label}</legend>
      <p id={helperId} className="text-sm text-slate-600">
        {helperText}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const inputId = `${generatedId}-${option.id}`;
          const descriptionId = `${inputId}-description`;

          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className="rounded-2xl border border-slate-200 bg-white p-3 text-sm shadow-sm has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                id={inputId}
                type="radio"
                name={`${generatedId}-chain`}
                value={option.id}
                checked={selectedChainId === option.id}
                disabled={option.disabled}
                aria-describedby={option.description ? descriptionId : undefined}
                onChange={() => {
                  setSelectedChainId(option.id);
                  onChange?.(option.id);
                }}
                className="mr-2 accent-emerald-700"
              />
              <span className="font-medium text-slate-950">{option.label}</span>
              {option.description ? (
                <span id={descriptionId} className="mt-1 block text-slate-600">
                  {option.description}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
      <p id={statusId} role="status" aria-live="polite" aria-atomic="true" className="text-sm text-slate-700">
        {selectedChain ? `${selectedChain.label} selected.` : 'Choose a chain to continue.'}
      </p>
    </fieldset>
  );
}
