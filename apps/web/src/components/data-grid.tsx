'use client';

import { useMemo, useState, type ComponentPropsWithoutRef } from 'react';

export const dataGridRowStripingClass = '[&_tbody_tr:nth-child(even)]:bg-slate-50 [&_[role=row]:nth-child(even)]:bg-slate-50';
export const dataGridActionClass = 'rounded-full border border-slate-300 px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-slate-700';
export const dataGridVirtualStatusClass = 'rounded-2xl border border-violet-100 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm';

type DataGridProps = ComponentPropsWithoutRef<'div'> & {
  striped?: boolean;
  dense?: boolean;
};

type DataGridProductCellProps = {
  brand?: string | null;
  imageUrl?: string | null;
  name: string;
  sourceUrl?: string | null;
  unitLabel?: string | null;
};

export function DataGrid({ className = '', striped = true, dense = false, ...props }: Readonly<DataGridProps>) {
  const striping = striped ? dataGridRowStripingClass : '';
  return (
    <div
      {...props}
      className={[
        'overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm',
        '[&_table]:w-full [&_td]:border-t [&_td]:border-slate-100 [&_th]:text-left',
        dense ? '[&_td]:px-3 [&_td]:py-2 [&_th]:px-3 [&_th]:py-2' : '[&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3',
        striping,
        className
      ].filter(Boolean).join(' ')}
    />
  );
}

export function DataGridProductCell({ brand, imageUrl, name, sourceUrl, unitLabel }: Readonly<DataGridProductCellProps>) {
  return (
    <div className="flex min-w-64 gap-3">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="" className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain" loading="lazy" src={imageUrl} />
      ) : (
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-xs font-black text-slate-400">No image</div>
      )}
      <div>
        <p className="font-black text-slate-950">{name}</p>
        <p className="text-xs text-slate-500">{brand || 'Unknown brand'} · {unitLabel || 'unit missing'}</p>
        {sourceUrl ? (
          <a className="mt-1 inline-flex text-xs font-black text-sky-800 underline decoration-sky-300 underline-offset-4" href={sourceUrl}>
            Source URL
          </a>
        ) : (
          <p className="mt-1 text-xs font-semibold text-slate-400">Source URL missing</p>
        )}
      </div>
    </div>
  );
}

type FilterOption = {
  value: string;
  label: string;
};

export type UnitAuditIssueRow = {
  id: string;
  source: string;
  kind: string;
  kindLabel: string;
  severity: string;
  productName: string;
  productId: string;
  packageText: string;
  detail: string;
};

type UnitAuditFilterTableProps = {
  rows: UnitAuditIssueRow[];
  sourceOptions: FilterOption[];
  severityOptions: FilterOption[];
  issueTypeOptions: FilterOption[];
};

export function UnitAuditFilterTable({
  rows,
  sourceOptions,
  severityOptions,
  issueTypeOptions
}: Readonly<UnitAuditFilterTableProps>) {
  const [sourceFilter, setSourceFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');

  const filteredRows = useMemo(() => rows.filter((row) => {
    const sourceMatches = sourceFilter === 'all' || row.source === sourceFilter;
    const severityMatches = severityFilter === 'all' || row.severity === severityFilter;
    const issueTypeMatches = issueTypeFilter === 'all' || row.kind === issueTypeFilter;
    return sourceMatches && severityMatches && issueTypeMatches;
  }), [issueTypeFilter, rows, severityFilter, sourceFilter]);

  const hasActiveFilter = sourceFilter !== 'all' || severityFilter !== 'all' || issueTypeFilter !== 'all';

  return (
    <section className="mt-5 rounded-3xl border border-amber-100 bg-white p-4 shadow-sm">
      <div className="grid gap-3 lg:grid-cols-4 lg:items-end">
        <FilterSelect label="Source" options={sourceOptions} value={sourceFilter} onChange={setSourceFilter} />
        <FilterSelect label="Severity" options={severityOptions} value={severityFilter} onChange={setSeverityFilter} />
        <FilterSelect label="Issue type" options={issueTypeOptions} value={issueTypeFilter} onChange={setIssueTypeFilter} />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-black text-slate-950">
            Showing {filteredRows.length.toLocaleString('sv-SE')} of {rows.length.toLocaleString('sv-SE')} audit rows
          </p>
          <button
            className="rounded-full border border-amber-200 px-4 py-2 text-sm font-black text-amber-900 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!hasActiveFilter}
            onClick={() => {
              setSourceFilter('all');
              setSeverityFilter('all');
              setIssueTypeFilter('all');
            }}
            type="button"
          >
            Reset filters
          </button>
        </div>
      </div>

      <DataGrid className="mt-4 overflow-x-auto" striped>
        <table>
          <thead>
            <tr className="bg-amber-50 text-xs font-black uppercase tracking-[0.14em] text-amber-900">
              <th>Source</th>
              <th>Severity</th>
              <th>Issue type</th>
              <th>Product</th>
              <th>Package text</th>
              <th>Review detail</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td className="font-black text-slate-950">{row.source}</td>
                <td>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-amber-950">
                    {row.severity}
                  </span>
                </td>
                <td className="font-semibold text-slate-700">{row.kindLabel}</td>
                <td>
                  <p className="font-black text-slate-950">{row.productName}</p>
                  <p className="mt-1 font-mono text-xs font-semibold text-slate-500">{row.productId}</p>
                </td>
                <td className="font-semibold text-slate-700">{row.packageText}</td>
                <td className="min-w-64 text-sm font-semibold leading-6 text-slate-700">{row.detail}</td>
              </tr>
            ))}
            {filteredRows.length === 0 ? (
              <tr>
                <td className="text-sm font-semibold text-slate-600" colSpan={6}>
                  No unit audit rows match the selected filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </DataGrid>
    </section>
  );
}

function FilterSelect({
  label,
  options,
  value,
  onChange
}: Readonly<{
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}>) {
  return (
    <label className="text-sm font-black text-slate-800">
      {label}
      <select
        className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-3 py-2 text-sm font-bold text-slate-900"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        <option value="all">All {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
