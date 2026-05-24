import type { ReactNode } from 'react';

export type DataGridRow = Readonly<{
  id: string;
  label: string;
  value: ReactNode | null;
}>;

export function EmptyDataGridCell({ label }: Readonly<{ label: string }>) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-500">
      {label}
    </span>
  );
}

export function DataGrid({
  emptyCellLabel = 'No value recorded',
  rows
}: Readonly<{
  emptyCellLabel?: string;
  rows: readonly DataGridRow[];
}>) {
  if (rows.length === 0) {
    return <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-600">No rows to display.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="bg-slate-950 text-white">
          <tr>
            <th className="px-4 py-3 font-black">Metric</th>
            <th className="px-4 py-3 font-black">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-slate-100" key={row.id}>
              <th className="px-4 py-3 font-black text-slate-950">{row.label}</th>
              <td className="px-4 py-3 text-slate-700">
                {row.value === null ? <EmptyDataGridCell label={emptyCellLabel} /> : row.value}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
