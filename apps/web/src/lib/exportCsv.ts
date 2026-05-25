export type CsvCell = string | number | boolean | null | undefined;

const formulaInjectionPrefixPattern = /^[\t\r\n ]*[=+\-@]/;

export function csvCell(value: CsvCell) {
  if (value === undefined || value === null) return '';
  const text = String(value);
  const safeText = formulaInjectionPrefixPattern.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safeText) ? `"${safeText.replace(/"/g, '""')}"` : safeText;
}

export function exportCsv(headers: readonly string[], rows: readonly (readonly CsvCell[])[]) {
  return [
    headers.map(csvCell).join(','),
    ...rows.map((row) => row.map(csvCell).join(','))
  ].join('\n') + '\n';
}

export function csvDataHref(csv: string) {
  return `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
}

export function csvFilenameSegment(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '') || 'item';
}
