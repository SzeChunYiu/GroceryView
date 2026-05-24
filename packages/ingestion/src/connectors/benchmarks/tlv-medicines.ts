const TLV_PERIODENS_VAROR_PAGE = 'https://www.tlv.se/apotek/generiskt-utbyte/periodens-varor.html';

export type BenchmarkObservation = {
  source_id: 'TLV_MEDICINES';
  country: 'SE';
  vertical: 'pharmacy';
  ecoicop_code: string;
  period: string;
  value: number;
  unit: 'SEK regulated_reference';
  observed_at: string;
};

export type TlvMedicineWorkbook = {
  url: string;
  period: string;
};

export type TlvMedicinePriceRow = {
  ecoicop_code?: string;
  period?: string;
  value?: number;
};

type FetchLike = (input: string | URL, init?: { headers?: Record<string, string> }) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
}>;

export const tlvMedicinesBenchmarkSource = {
  source_id: 'TLV_MEDICINES',
  country: 'SE',
  vertical: 'pharmacy',
  cadence: 'quarterly',
  status: 'ingestion_ready',
  label: 'regulated_reference'
} as const;

export async function discoverLatestTlvMedicineWorkbook(fetchImpl: FetchLike): Promise<TlvMedicineWorkbook | null> {
  const response = await fetchImpl(TLV_PERIODENS_VAROR_PAGE, { headers: { accept: 'text/html' } });
  if (!response.ok) throw new Error(`TLV medicines source request failed: ${response.status}`);
  return parseLatestTlvMedicineWorkbook(await response.text());
}

export function parseLatestTlvMedicineWorkbook(html: string): TlvMedicineWorkbook | null {
  const match = html.match(/href="([^"]+\.xlsx?)"[^>]*>\s*Periodens varor ([^<]+)/i);
  if (!match) return null;

  return {
    url: new URL(match[1].replaceAll('&amp;', '&'), TLV_PERIODENS_VAROR_PAGE).toString(),
    period: parseSwedishPeriod(match[2])
  };
}

export function toTlvBenchmarkObservation(
  row: TlvMedicinePriceRow,
  observedAt: string
): BenchmarkObservation | null {
  if (!row.ecoicop_code || !row.period || typeof row.value !== 'number' || !Number.isFinite(row.value)) return null;

  return {
    source_id: 'TLV_MEDICINES',
    country: 'SE',
    vertical: 'pharmacy',
    ecoicop_code: row.ecoicop_code,
    period: row.period,
    value: row.value,
    unit: 'SEK regulated_reference',
    observed_at: observedAt
  };
}

function parseSwedishPeriod(label: string): string {
  const monthName = label.trim().split(/\s+/)[0]?.toLocaleLowerCase('sv-SE');
  const year = label.match(/20\d{2}/)?.[0] ?? new Date().getUTCFullYear().toString();
  const month = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'].indexOf(monthName) + 1;
  return `${year}-${String(month || 1).padStart(2, '0')}`;
}
