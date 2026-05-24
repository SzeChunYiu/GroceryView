import { createHash } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';

export type BenchmarkObservation = {
  source_id: 'NOMA_MEDICINES';
  country: 'NO';
  vertical: 'pharmacy';
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

export type NomaMedicinePriceKind = 'ppp' | 'prp' | 'stepped_price' | 'reimbursed_price';

export type NomaMedicinePriceRow = {
  articleNumber: string;
  productName: string;
  atcCode: string;
  priceKind: NomaMedicinePriceKind;
  value: number;
  period: string;
  unit: 'NOK regulated_reference';
  sourceUrl: string;
  observedAt: string;
};

export type FetchNomaMedicinesOptions = {
  fetchImpl?: typeof fetch;
  sourceUrl?: string;
  observedAt?: string;
};

export const NOMA_MEDICINES_SOURCE_ID = 'NOMA_MEDICINES';
export const NOMA_MEDICINES_COUNTRY = 'NO';
export const NOMA_MEDICINES_VERTICAL = 'pharmacy';
export const NOMA_MEDICINES_STATUS = 'live';
export const NOMA_MEDICINES_FREQUENCY = 'quarterly';
export const NOMA_MEDICINES_SOURCE_URL = 'https://www.dmp.no/contentassets/fed1be54a81f4ec99a2329ca0fd0964c/package-prices-2026-05-04.xlsx';

const PRICE_HEADERS: Array<{ header: string; kind: NomaMedicinePriceKind }> = [
  { header: 'PPP', kind: 'ppp' },
  { header: 'PRP', kind: 'prp' },
  { header: 'Stepped price', kind: 'stepped_price' },
  { header: 'Reimbursed price', kind: 'reimbursed_price' }
];

export async function fetchNomaMedicineBenchmarkObservations(options: FetchNomaMedicinesOptions = {}): Promise<BenchmarkObservation[]> {
  const sourceUrl = options.sourceUrl ?? NOMA_MEDICINES_SOURCE_URL;
  const observedAt = options.observedAt ?? new Date().toISOString();
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/octet-stream',
      'user-agent': 'GroceryView/0.1 benchmark-noma-medicines (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (!response.ok) throw new Error(`NoMA medicines source failed with HTTP ${response.status}`);
  const workbook = Buffer.from(await response.arrayBuffer());
  return nomaMedicineRowsToBenchmarkObservations(parseNomaMedicinesWorkbook(workbook, { sourceUrl, observedAt }));
}

export function parseNomaMedicinesWorkbook(workbook: Buffer, context: { sourceUrl?: string; observedAt: string }): NomaMedicinePriceRow[] {
  const entries = readZipEntries(workbook);
  const worksheetXml = entries.get('xl/worksheets/sheet1.xml');
  if (!worksheetXml) throw new Error('NoMA workbook missing xl/worksheets/sheet1.xml');
  const sharedStrings = parseSharedStrings(entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '');
  return parseNomaMedicinesWorksheetRows(parseWorksheetRows(worksheetXml.toString('utf8'), sharedStrings), context);
}

export function parseNomaMedicinesWorksheetRows(rows: string[][], context: { sourceUrl?: string; observedAt: string }): NomaMedicinePriceRow[] {
  const sourceUrl = context.sourceUrl ?? NOMA_MEDICINES_SOURCE_URL;
  const period = periodFromRows(rows);
  if (!period) return [];
  const headerIndex = rows.findIndex((row) => row.includes('Product name') && row.includes('PPP'));
  if (headerIndex === -1) return [];

  const headers = rows[headerIndex]!;
  const articleIndex = headers.indexOf('Article number');
  const productIndex = headers.indexOf('Product name');
  const atcIndex = headers.indexOf('ATC-code');
  if (articleIndex === -1 || productIndex === -1 || atcIndex === -1) return [];

  return rows.slice(headerIndex + 1).flatMap((row) => {
    const articleNumber = cell(row, articleIndex);
    const productName = cell(row, productIndex);
    const atcCode = cell(row, atcIndex);
    if (!articleNumber || !productName || !atcCode) return [];

    return PRICE_HEADERS.flatMap((price) => {
      const priceIndex = headers.indexOf(price.header);
      const value = priceIndex === -1 ? null : numberOrNull(cell(row, priceIndex));
      if (value === null || value <= 0) return [];
      return [{
        articleNumber,
        productName,
        atcCode,
        priceKind: price.kind,
        value,
        period,
        unit: 'NOK regulated_reference' as const,
        sourceUrl,
        observedAt: context.observedAt
      }];
    });
  });
}

export function nomaMedicineRowsToBenchmarkObservations(rows: NomaMedicinePriceRow[]): BenchmarkObservation[] {
  return rows.map((row) => ({
    source_id: NOMA_MEDICINES_SOURCE_ID,
    country: NOMA_MEDICINES_COUNTRY,
    vertical: NOMA_MEDICINES_VERTICAL,
    ecoicop_code: `NOMA:${row.atcCode}:${row.articleNumber}:${row.priceKind}`,
    period: row.period,
    value: row.value,
    unit: `NOK regulated_reference_${row.priceKind}`,
    observed_at: row.observedAt
  }));
}

export function benchmarkObservationInsertSql(rows: BenchmarkObservation[]): { sql: string; values: Array<string | number> } {
  if (rows.length === 0) return { sql: 'select 1 where false', values: [] };
  const values: Array<string | number> = [];
  const placeholders = rows.map((row, index) => {
    const offset = index * 8;
    values.push(row.source_id, row.country, row.vertical, row.ecoicop_code, row.period, row.value, row.unit, row.observed_at);
    return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8})`;
  });

  return {
    sql: `insert into benchmark_observation (source_id, country, vertical, ecoicop_code, period, value, unit, observed_at) values ${placeholders.join(', ')} on conflict do nothing`,
    values
  };
}

function periodFromRows(rows: string[][]): string | null {
  for (const row of rows.slice(0, 5)) {
    for (const value of row) {
      const match = value.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
      if (match) return match[0]!;
    }
  }
  return null;
}

function parseWorksheetRows(xml: string, sharedStrings: string[]): string[][] {
  const rows: string[][] = [];
  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values: string[] = [];
    for (const cellMatch of rowMatch[1]!.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1]!;
      const body = cellMatch[2]!;
      const ref = attrs.match(/\br="([A-Z]+)\d+"/)?.[1];
      const index = ref ? columnIndex(ref) : values.length;
      values[index] = cellValue(attrs, body, sharedStrings);
    }
    rows.push(values.map((value) => value ?? ''));
  }
  return rows;
}

function cellValue(attrs: string, body: string, sharedStrings: string[]): string {
  const inline = body.match(/<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/)?.[1];
  if (inline !== undefined) return decodeXml(inline);
  const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? '';
  if (/\bt="s"/.test(attrs)) return sharedStrings[Number(rawValue)] ?? '';
  return decodeXml(rawValue);
}

function parseSharedStrings(xml: string): string[] {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => {
    const textRuns = [...match[1]!.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((run) => decodeXml(run[1]!));
    return textRuns.join('');
  });
}

type ZipCentralDirectoryEntry = {
  name: string;
  compressionMethod: number;
  compressedSize: number;
  localHeaderOffset: number;
};

function readZipEntries(buffer: Buffer): Map<string, Buffer> {
  const entries = new Map<string, Buffer>();
  for (const entry of readCentralDirectory(buffer)) {
    const dataOffset = localFileDataOffset(buffer, entry.localHeaderOffset);
    const compressed = buffer.subarray(dataOffset, dataOffset + entry.compressedSize);
    if (entry.compressionMethod === 0) entries.set(entry.name, compressed);
    else if (entry.compressionMethod === 8) entries.set(entry.name, inflateRawSync(compressed));
  }
  return entries;
}

function readCentralDirectory(buffer: Buffer): ZipCentralDirectoryEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  const centralDirectorySize = buffer.readUInt32LE(eocdOffset + 12);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipCentralDirectoryEntry[] = [];
  let offset = centralDirectoryOffset;
  const end = centralDirectoryOffset + centralDirectorySize;

  while (offset < end) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error('Invalid XLSX central directory');
    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString('utf8');
    entries.push({ name, compressionMethod, compressedSize, localHeaderOffset });
    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function findEndOfCentralDirectory(buffer: Buffer): number {
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 66000); offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) return offset;
  }
  throw new Error('Invalid XLSX: end of central directory not found');
}

function localFileDataOffset(buffer: Buffer, localHeaderOffset: number): number {
  if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) throw new Error('Invalid XLSX local file header');
  const fileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
  const extraLength = buffer.readUInt16LE(localHeaderOffset + 28);
  return localHeaderOffset + 30 + fileNameLength + extraLength;
}

function columnIndex(column: string): number {
  return [...column].reduce((index, char) => index * 26 + char.charCodeAt(0) - 64, 0) - 1;
}

function cell(row: string[], index: number): string {
  return (row[index] ?? '').trim();
}

function numberOrNull(value: string): number | null {
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? Math.round((parsed + Number.EPSILON) * 100) / 100 : null;
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
}

export function nomaMedicinesRawSnapshotRef(body: Buffer): string {
  return `raw://noma-medicines/${createHash('sha256').update(body).digest('hex').slice(0, 24)}`;
}
