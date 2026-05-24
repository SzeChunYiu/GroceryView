'use client';

import type { KeyboardEvent } from 'react';
import { useState } from 'react';

export type BasketBuilderRow = {
  id: string;
  name: string;
  quantityLabel?: string;
};

type BasketBuilderProps = {
  initialRows: readonly BasketBuilderRow[];
  onRowsChange?: (rows: BasketBuilderRow[]) => void;
};

function isEditableTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  return Boolean(element?.closest('input, textarea, select, [contenteditable="true"]'));
}

export function BasketBuilder({ initialRows, onRowsChange }: BasketBuilderProps) {
  const [rows, setRows] = useState(() => [...initialRows]);

  function removeBasketRow(row: BasketBuilderRow) {
    if (!window.confirm(`Remove ${row.name} from this basket?`)) return;
    const nextRows = rows.filter((candidate) => candidate.id !== row.id);
    setRows(nextRows);
    onRowsChange?.(nextRows);
  }

  function handleBasketRowKeyDown(event: KeyboardEvent<HTMLDivElement>, row: BasketBuilderRow) {
    if (event.key !== 'Backspace' || event.defaultPrevented || isEditableTarget(event.target)) return;
    event.preventDefault();
    removeBasketRow(row);
  }

  return (
    <div className="grid gap-2" role="list" aria-label="Basket rows">
      {rows.map((row) => (
        <div
          aria-label={`${row.name} basket row`}
          className="rounded-2xl border border-slate-200 bg-white p-3 outline-none focus:ring-2 focus:ring-emerald-600"
          key={row.id}
          onKeyDown={(event) => handleBasketRowKeyDown(event, row)}
          role="listitem"
          tabIndex={0}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-black text-slate-950">{row.name}</p>
              {row.quantityLabel ? <p className="text-xs font-semibold text-slate-500">{row.quantityLabel}</p> : null}
            </div>
            <button className="rounded-full bg-rose-50 px-3 py-2 text-xs font-black text-rose-900" onClick={() => removeBasketRow(row)} type="button">
              Remove
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
