export type BenchmarkObservation = {
  source_id: 'TLV_MEDICINES';
  country: 'SE';
  vertical: 'pharmacy';
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

export type TlvMedicinesFetch = (url: string, init?: { headers?: Record<string, string> }) => Promise<{ text(): Promise<string> }>;

export const TLV_MEDICINES_SOURCE_ID = 'TLV_MEDICINES' as const;
export const TLV_MEDICINES_OPEN_DATA_URL = 'https://www.tlv.se/lakemedelsforetag/om-tlv/oppna-data.html';
export const TLV_MEDICINES_CONNECTOR = {
  id: TLV_MEDICINES_SOURCE_ID,
  country: 'SE',
  vertical: 'pharmacy',
  frequency: 'quarterly',
  label: 'regulated_reference',
  endpoint: TLV_MEDICINES_OPEN_DATA_URL
} as const;

export async function fetchTlvMedicinesBenchmarkObservations(
  fetchImpl: TlvMedicinesFetch = fetch,
  observedAt = new Date().toISOString()
): Promise<BenchmarkObservation[]> {
  const response = await fetchImpl(TLV_MEDICINES_OPEN_DATA_URL, {
    headers: {
      accept: 'text/csv,application/json,text/html,application/xhtml+xml',
      'user-agent': 'GroceryView benchmark ingestion TLV_MEDICINES/1.0'
    }
  });
  return parseTlvMedicinesBenchmarkObservations(await response.text(), observedAt);
}

export function parseTlvMedicinesBenchmarkObservations(raw: string, observedAt: string): BenchmarkObservation[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return parseJsonRows(trimmed, observedAt);
  if (trimmed.includes('\n') && trimmed.includes(';')) return parseDelimitedRows(trimmed, ';', observedAt);
  if (trimmed.includes('\n') && trimmed.includes(',')) return parseDelimitedRows(trimmed, ',', observedAt);
  return [];
}

function parseJsonRows(raw: string, observedAt: string): BenchmarkObservation[] {
  const parsed = JSON.parse(raw) as unknown;
  const rows = Array.isArray(parsed) ? parsed : typeof parsed === 'object' && parsed !== null && 'rows' in parsed ? (parsed as { rows?: unknown }).rows : [];
  if (!Array.isArray(rows)) return [];
  return rows.flatMap((row) => normalizeRow(row as Record<string, unknown>, observedAt));
}

function parseDelimitedRows(raw: string, delimiter: ',' | ';', observedAt: string): BenchmarkObservation[] {
  const [headerLine, ...lines] = raw.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = splitDelimitedLine(headerLine, delimiter).map(normalizeHeader);
  return lines.flatMap((line) => {
    const cells = splitDelimitedLine(line, delimiter);
    const row = Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
    return normalizeRow(row, observedAt);
  });
}

function normalizeRow(row: Record<string, unknown>, observedAt: string): BenchmarkObservation[] {
  const value = parseNumber(row.value ?? row.pris ?? row.aup ?? row.aip);
  const period = String(row.period ?? row.datum ?? row.date ?? '').slice(0, 10);
  if (value === undefined || !period) return [];
  return [{
    source_id: TLV_MEDICINES_SOURCE_ID,
    country: 'SE',
    vertical: 'pharmacy',
    ecoicop_code: String(row.ecoicop_code ?? row.atc ?? row.atc_code ?? '06.1.1'),
    period,
    value,
    unit: String(row.unit ?? row.enhet ?? row.price_type ?? 'SEK regulated reference'),
    observed_at: observedAt
  }];
}

function splitDelimitedLine(line: string, delimiter: ',' | ';'): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (const character of line) {
    if (character === '"') {
      quoted = !quoted;
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = '';
    } else {
      current += character;
    }
  }
  cells.push(current.trim());
  return cells;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function parseNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value.replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}
