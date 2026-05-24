"use client";

import { useId, type KeyboardEvent } from "react";

type PriceRangeSliderProps = {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  minLabel?: string;
  maxLabel?: string;
  step?: number;
  disabled?: boolean;
  isLoading?: boolean;
  statusMessage?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const activateOnEnterOrSpace = (
  event: KeyboardEvent<HTMLButtonElement>,
  action: () => void,
) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    action();
  }
};

export function PriceRangeSlider({
  min,
  max,
  value,
  onChange,
  label = "Price range",
  minLabel = "Minimum price",
  maxLabel = "Maximum price",
  step = 1,
  disabled = false,
  isLoading = false,
  statusMessage,
}: PriceRangeSliderProps) {
  const descriptionId = useId();
  const statusId = useId();
  const [currentMin, currentMax] = value;
  const resetRange = () => onChange([min, max]);
  const describedBy = `${descriptionId} ${statusId}`;

  return (
    <fieldset className="space-y-3" disabled={disabled || isLoading}>
      <legend className="text-sm font-medium text-slate-900">{label}</legend>
      <p id={descriptionId} className="text-sm text-slate-600">
        Use the sliders to choose prices between {min} and {max}.
      </p>
      <div className="grid gap-3">
        <label className="grid gap-1 text-sm text-slate-700">
          <span>{minLabel}</span>
          <input
            aria-describedby={describedBy}
            aria-label={minLabel}
            aria-valuemax={currentMax}
            aria-valuemin={min}
            aria-valuenow={currentMin}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            max={currentMax}
            min={min}
            onChange={(event) =>
              onChange([
                clamp(Number(event.target.value), min, currentMax),
                currentMax,
              ])
            }
            role="slider"
            step={step}
            type="range"
            value={currentMin}
          />
        </label>
        <label className="grid gap-1 text-sm text-slate-700">
          <span>{maxLabel}</span>
          <input
            aria-describedby={describedBy}
            aria-label={maxLabel}
            aria-valuemax={max}
            aria-valuemin={currentMin}
            aria-valuenow={currentMax}
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            max={max}
            min={currentMin}
            onChange={(event) =>
              onChange([
                currentMin,
                clamp(Number(event.target.value), currentMin, max),
              ])
            }
            role="slider"
            step={step}
            type="range"
            value={currentMax}
          />
        </label>
      </div>
      <button
        aria-describedby={describedBy}
        aria-label="Reset price range"
        className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={disabled || isLoading}
        onClick={resetRange}
        onKeyDown={(event) => activateOnEnterOrSpace(event, resetRange)}
        type="button"
      >
        Reset
      </button>
      <p
        id={statusId}
        role="status"
        aria-live="polite"
        className="text-sm text-slate-600"
      >
        {isLoading ? "Updating price range…" : statusMessage}
      </p>
    </fieldset>
  );
}
