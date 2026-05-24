export type BenchmarkObservation = {
  source_id: 'STATICE_ENERGY';
  country: 'IS';
  vertical: 'fuel';
  ecoicop_code: string;
  period: string;
  value: number;
  unit: string;
  observed_at: string;
};

export const STATICE_ENERGY_ENDPOINT = 'https://px.hagstofa.is/pxis/api/v1/is/Efnahagur/utanrikisverslun/';

export async function fetchStaticeEnergyObservations(options: { fetchImpl?: typeof fetch; observedAt?: string } = {}) {
  const response = await (options.fetchImpl ?? fetch)(STATICE_ENERGY_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: [], response: { format: 'json-stat2' } })
  });
  if (!response.ok) throw new Error(`STATICE_ENERGY fetch failed: ${response.status}`);
  return parseStaticeEnergyResponse(await response.json(), options.observedAt ?? new Date().toISOString());
}

export function parseStaticeEnergyResponse(payload: unknown, observedAt: string): BenchmarkObservation[] {
  const record = payload as { dimension?: Record<string, { category?: { index?: Record<string, number> } }>; value?: unknown[] };
  const dimensions = record.dimension ?? {};
  const ids = Object.keys(dimensions);
  const values = Array.isArray(record.value) ? record.value : [];
  const periodId = ids.find((id) => /period|time|mán|man|month/i.test(id)) ?? ids[0];
  const codeId = ids.find((id) => id !== periodId) ?? ids[1];
  const periodLabels = labelsFor(dimensions[periodId]);
  const codeLabels = labelsFor(dimensions[codeId]);
  const rows: BenchmarkObservation[] = [];

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const periodIndex = codeLabels.length > 0 ? Math.floor(index / codeLabels.length) : index;
    const codeIndex = codeLabels.length > 0 ? index % codeLabels.length : 0;
    const period = periodLabels[periodIndex];
    const ecoicop = codeLabels[codeIndex] ?? 'ENERGY';
    if (!period) continue;
    rows.push({ source_id: 'STATICE_ENERGY', country: 'IS', vertical: 'fuel', ecoicop_code: ecoicop, period, value, unit: 'index', observed_at: observedAt });
  }

  return rows;
}

function labelsFor(dimension: { category?: { index?: Record<string, number> } } | undefined) {
  return Object.entries(dimension?.category?.index ?? {}).sort((a, b) => a[1] - b[1]).map(([label]) => label);
}
