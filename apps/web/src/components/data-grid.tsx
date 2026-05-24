import type { ReactNode } from 'react';

export type DataGridColumn<Row> = {
  key: string;
  header: ReactNode;
  className?: string;
  render: (row: Row) => ReactNode;
};

type DataGridProps<Row> = {
  columns: DataGridColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row, index: number) => string;
  emptyLabel?: string;
};

export function DataGrid<Row>({ columns, rows, rowKey, emptyLabel = 'No rows to display' }: Readonly<DataGridProps<Row>>) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
          <thead className="bg-slate-950 text-white">
            <tr>
              {columns.map((column) => (
                <th className={`px-4 py-3 text-xs font-black uppercase tracking-[0.18em] ${column.className ?? ''}`} key={column.key}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row, index) => (
              <tr className="border-b border-slate-200 odd:bg-white even:bg-slate-50 hover:bg-emerald-50/70" key={rowKey(row, index)}>
                {columns.map((column) => (
                  <td className={`px-4 py-3 font-semibold text-slate-700 ${column.className ?? ''}`} key={column.key}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            )) : (
              <tr>
                <td className="px-4 py-6 text-center text-sm font-semibold text-slate-500" colSpan={columns.length}>{emptyLabel}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
