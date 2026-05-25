export type BenchmarkObservation = Readonly<{
  sourceId: 'TLV_MEDICINES';
  country: 'SE';
  vertical: 'pharmacy';
  ecoicopCode: string;
  period: string;
  value: number;
  unit: string;
  observedAt: string;
}>;

export type FetchTlvMedicinesOptions = Readonly<{
  fetchImpl?: typeof fetch;
  endpoint?: string;
  observedAt?: string;
}>;

export const TLV_MEDICINES_SOURCE_ID = 'TLV_MEDICINES' as const;
export const TLV_MEDICINES_ENDPOINT = 'https://www.tlv.se/download/18.467926b615d084471ac33996/1654594873847/prisdatabas.csv';
export const TLV_MEDICINES_CRON = '23 4 3 JAN,APR,JUL,OCT *';
export const TLV_MEDICINES_REGISTRY_STATUS = 'ingestion_ready' as const;

const DEFAULT_ECOICOP_CODE = '06.1.1';

function cleanCell(value: string | undefined) {
  return (value ?? '').replace(/^\uFEFF/, '').trim().replace(/^"|"$/g, '').trim();
}

function splitDelimitedLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === delimiter && !quoted) {
      cells.push(cleanCell(current));
      current = '';
      continue;
    }
    current += char;
  }
  cells.push(cleanCell(current));
  return cells;
}

function delimiterFor(headerLine: string) {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons >= commas ? ';' : ',';
}

function normalizedHeader(value: string) {
  return value.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '');
}

function field(row: Record<string, string>, names: readonly string[]) {
  for (const name of names) {
    const value = row[normalizedHeader(name)];
    if (value) return value;
  }
  return '';
}

function numericValue(value: string) {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function periodValue(row: Record<string, string>) {
  const raw = field(row, ['period', 'manad', 'månad', 'datum', 'beslutsdatum', 'gallerfran', 'gäller från', 'from']);
  const match = raw.match(/(20\d{2})[-/.]?(0[1-9]|1[0-2])(?:[-/.]?([0-3]\d))?/);
  if (!match) return '';
  return match[3] ? `${match[1]}-${match[2]}-${match[3]}` : `${match[1]}-${match[2]}`;
}

export function parseTlvMedicinesCsv(csv: string, observedAt: string): BenchmarkObservation[] {
  const lines = csv.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const delimiter = delimiterFor(lines[0]!);
  const headers = splitDelimitedLine(lines[0]!, delimiter).map(normalizedHeader);

  return lines.slice(1).flatMap((line): BenchmarkObservation[] => {
    const cells = splitDelimitedLine(line, delimiter);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    const value = numericValue(field(row, ['value', 'pris', 'apotekensutforsaljningspris', 'aip', 'aup', 'price']));
    const period = periodValue(row);
    if (value === null || !period) return [];
    return [{
      sourceId: TLV_MEDICINES_SOURCE_ID,
      country: 'SE',
      vertical: 'pharmacy',
      ecoicopCode: field(row, ['ecoicop', 'ecoicop_code']) || DEFAULT_ECOICOP_CODE,
      period,
      value,
      unit: field(row, ['unit', 'enhet', 'currency']) || 'SEK regulated_reference',
      observedAt
    }];
  });
}

export async function fetchTlvMedicinesBenchmarkObservations(options: FetchTlvMedicinesOptions = {}): Promise<BenchmarkObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? TLV_MEDICINES_ENDPOINT;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const response = await fetchImpl(endpoint, { headers: { accept: 'text/csv, text/plain, */*' } });
  if (!response.ok) throw new Error(`TLV_MEDICINES request failed: ${response.status}`);
  return parseTlvMedicinesCsv(await response.text(), observedAt);
}
