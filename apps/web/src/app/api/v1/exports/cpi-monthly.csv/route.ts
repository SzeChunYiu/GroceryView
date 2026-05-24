import { NextResponse } from 'next/server';
import { personalGroceryInflation } from '@/lib/demo-data';

const license = 'CC0-1.0';

function csvEscape(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function GET() {
  const period = personalGroceryInflation.currentDate.match(/\d{4}-\d{2}/)?.[0] ?? '2026-05';
  const rows = personalGroceryInflation.categoryContributions.map((row) => ({
    agency_schema: 'SCB_SSB_HAGSTOFA_CPI_MONTHLY',
    country: 'SE',
    period,
    category: row.category,
    index_value: (100 + row.changePercent).toFixed(2),
    change_percent: row.changePercent.toFixed(2),
    base_spend: row.spend.toFixed(2),
    current_spend: (row.spend * (1 + row.changePercent / 100)).toFixed(2),
    currency: 'SEK',
    source: 'GroceryView visible weekly basket CPI calculation',
    license
  }));

  const headers = ['agency_schema', 'country', 'period', 'category', 'index_value', 'change_percent', 'base_spend', 'current_spend', 'currency', 'source', 'license'];
  const body = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key as keyof typeof row])).join(','))].join('\n') + '\n';

  return new NextResponse(body, {
    headers: {
      'content-disposition': 'attachment; filename="groceryview-cpi-monthly.csv"',
      'content-type': 'text/csv; charset=utf-8',
      'x-open-data-license': license
    }
  });
}
