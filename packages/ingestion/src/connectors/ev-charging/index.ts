import { createHash } from 'node:crypto';

export type EvChargingOperatorId = 'ionity' | 'recharge' | 'mer' | 'tesla';
export type EvChargingCountry = 'SE' | 'NO' | 'DK' | 'FI';
export type EvChargingCurrency = 'SEK' | 'NOK' | 'DKK' | 'EUR';
export type EvChargingSourceKind = 'operator_public_tariff' | 'operator_station_feed' | 'crowd_station_report';

export type EvChargingSourceConfig = {
  operatorId: EvChargingOperatorId;
  operatorName: string;
  country: EvChargingCountry;
  currency: EvChargingCurrency;
  sourceUrl: string;
  sourceKind: EvChargingSourceKind;
};

export type EvChargingPriceObservation = {
  domain: 'ev_charging';
  stationId: string;
  stationName: string;
  operatorId: EvChargingOperatorId;
  operatorName: string;
  country: EvChargingCountry;
  latitude: number | null;
  longitude: number | null;
  connectorTypes: string[];
  maxPowerKw: number | null;
  pricePerKwh: number;
  currency: EvChargingCurrency;
  unit: 'kWh';
  idleFeePerMinute: number | null;
  sourceKind: EvChargingSourceKind;
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  confidence: number;
  provenance: {
    source: 'ev_charging_prices';
    parserVersion: 'ev-charging-prices-v1';
    rawSnapshotRef: string;
    rawOperator: string;
    rawCountry: EvChargingCountry;
  };
};

export type FuelStyleEvChargingMapRow = {
  id: string;
  domain: 'ev_charging';
  label: string;
  operatorName: string;
  country: EvChargingCountry;
  latitude: number | null;
  longitude: number | null;
  priceLabel: string;
  pricePerUnit: number;
  unit: 'kWh';
  currency: EvChargingCurrency;
  sourceUrl: string;
  observedAt: string;
};

export type FetchEvChargingPricesOptions = {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sources?: EvChargingSourceConfig[];
};

export const IONITY_EV_CHARGING_SOURCES: EvChargingSourceConfig[] = [
  { operatorId: 'ionity', operatorName: 'IONITY', country: 'SE', currency: 'SEK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://ionity.eu/en/network/access-and-payment' },
  { operatorId: 'ionity', operatorName: 'IONITY', country: 'NO', currency: 'NOK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://ionity.eu/en/network/access-and-payment' },
  { operatorId: 'ionity', operatorName: 'IONITY', country: 'DK', currency: 'DKK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://ionity.eu/en/network/access-and-payment' },
  { operatorId: 'ionity', operatorName: 'IONITY', country: 'FI', currency: 'EUR', sourceKind: 'operator_public_tariff', sourceUrl: 'https://ionity.eu/en/network/access-and-payment' }
];

export const RECHARGE_EV_CHARGING_SOURCES: EvChargingSourceConfig[] = [
  { operatorId: 'recharge', operatorName: 'Recharge', country: 'SE', currency: 'SEK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://rechargeinfra.com/se/priser/' },
  { operatorId: 'recharge', operatorName: 'Recharge', country: 'NO', currency: 'NOK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://rechargeinfra.com/no/priser/' },
  { operatorId: 'recharge', operatorName: 'Recharge', country: 'DK', currency: 'DKK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://rechargeinfra.com/dk/priser/' },
  { operatorId: 'recharge', operatorName: 'Recharge', country: 'FI', currency: 'EUR', sourceKind: 'operator_public_tariff', sourceUrl: 'https://rechargeinfra.com/fi/priser/' }
];

export const MER_EV_CHARGING_SOURCES: EvChargingSourceConfig[] = [
  { operatorId: 'mer', operatorName: 'Mer', country: 'SE', currency: 'SEK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://se.mer.eco/ladda-elbil/priser/' },
  { operatorId: 'mer', operatorName: 'Mer', country: 'NO', currency: 'NOK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://no.mer.eco/lade-elbil/priser/' },
  { operatorId: 'mer', operatorName: 'Mer', country: 'DK', currency: 'DKK', sourceKind: 'operator_public_tariff', sourceUrl: 'https://dk.mer.eco/oplad-elbil/priser/' },
  { operatorId: 'mer', operatorName: 'Mer', country: 'FI', currency: 'EUR', sourceKind: 'operator_public_tariff', sourceUrl: 'https://fi.mer.eco/lataa-sahkoauto/hinnat/' }
];

export const TESLA_SUPERCHARGER_SOURCES: EvChargingSourceConfig[] = [
  { operatorId: 'tesla', operatorName: 'Tesla Supercharger', country: 'SE', currency: 'SEK', sourceKind: 'operator_station_feed', sourceUrl: 'https://www.tesla.com/findus/list/superchargers/Sweden' },
  { operatorId: 'tesla', operatorName: 'Tesla Supercharger', country: 'NO', currency: 'NOK', sourceKind: 'operator_station_feed', sourceUrl: 'https://www.tesla.com/findus/list/superchargers/Norway' },
  { operatorId: 'tesla', operatorName: 'Tesla Supercharger', country: 'DK', currency: 'DKK', sourceKind: 'operator_station_feed', sourceUrl: 'https://www.tesla.com/findus/list/superchargers/Denmark' },
  { operatorId: 'tesla', operatorName: 'Tesla Supercharger', country: 'FI', currency: 'EUR', sourceKind: 'operator_station_feed', sourceUrl: 'https://www.tesla.com/findus/list/superchargers/Finland' }
];

export const DEFAULT_EV_CHARGING_SOURCES: EvChargingSourceConfig[] = [
  ...IONITY_EV_CHARGING_SOURCES,
  ...RECHARGE_EV_CHARGING_SOURCES,
  ...MER_EV_CHARGING_SOURCES,
  ...TESLA_SUPERCHARGER_SOURCES
];

export async function fetchEvChargingPrices(options: FetchEvChargingPricesOptions = {}): Promise<EvChargingPriceObservation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const sources = options.sources ?? DEFAULT_EV_CHARGING_SOURCES;
  const observations: EvChargingPriceObservation[] = [];

  for (const source of sources) {
    const response = await fetchImpl(source.sourceUrl, {
      headers: {
        accept: 'application/json,text/csv,text/plain,text/html',
        'user-agent': 'GroceryView/0.1 ev-charging-connector (+https://github.com/SzeChunYiu/GroceryView)'
      }
    });
    if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
      throw new Error(`${source.operatorName} EV charging source blocked with HTTP ${response.status}`);
    }
    if (!response.ok) throw new Error(`${source.operatorName} EV charging source failed with HTTP ${response.status}`);
    const body = await response.text();
    observations.push(...parseEvChargingPriceFeed(body, source, capturedAt));
  }

  return observations;
}

export function fetchIonityEvChargingPrices(options: Omit<FetchEvChargingPricesOptions, 'sources'> = {}) {
  return fetchEvChargingPrices({ ...options, sources: IONITY_EV_CHARGING_SOURCES });
}

export function fetchRechargeEvChargingPrices(options: Omit<FetchEvChargingPricesOptions, 'sources'> = {}) {
  return fetchEvChargingPrices({ ...options, sources: RECHARGE_EV_CHARGING_SOURCES });
}

export function fetchMerEvChargingPrices(options: Omit<FetchEvChargingPricesOptions, 'sources'> = {}) {
  return fetchEvChargingPrices({ ...options, sources: MER_EV_CHARGING_SOURCES });
}

export function fetchTeslaSuperchargerPrices(options: Omit<FetchEvChargingPricesOptions, 'sources'> = {}) {
  return fetchEvChargingPrices({ ...options, sources: TESLA_SUPERCHARGER_SOURCES });
}

export function parseEvChargingPriceFeed(body: string, source: EvChargingSourceConfig, capturedAt: string): EvChargingPriceObservation[] {
  const rows = parseJsonRows(body) ?? parseCsvRows(body) ?? parseTariffTextRows(body, source);
  const rawSnapshotRef = `raw://ev-charging/${source.operatorId}/${source.country}/${contentHashFor(body)}`;

  return rows
    .map((row, index) => normalizeEvChargingPriceRow(row, source, capturedAt, rawSnapshotRef, index))
    .filter((row): row is EvChargingPriceObservation => row !== null);
}

export function evChargingToFuelStyleMapRows(observations: EvChargingPriceObservation[]): FuelStyleEvChargingMapRow[] {
  return observations.map((observation) => ({
    id: observation.stationId,
    domain: 'ev_charging',
    label: observation.stationName,
    operatorName: observation.operatorName,
    country: observation.country,
    latitude: observation.latitude,
    longitude: observation.longitude,
    priceLabel: `${formatDecimal(observation.pricePerKwh)} ${observation.currency}/kWh`,
    pricePerUnit: observation.pricePerKwh,
    unit: 'kWh',
    currency: observation.currency,
    sourceUrl: observation.sourceUrl,
    observedAt: observation.observedAt
  }));
}

type RawEvChargingRow = Record<string, unknown>;

function normalizeEvChargingPriceRow(
  row: RawEvChargingRow,
  source: EvChargingSourceConfig,
  capturedAt: string,
  rawSnapshotRef: string,
  index: number
): EvChargingPriceObservation | null {
  const pricePerKwh = moneyOrNull(row.pricePerKwh ?? row.price_per_kwh ?? row.kwhPrice ?? row.price ?? row.tariff);
  if (pricePerKwh === null) return null;

  const stationName = text(row.stationName ?? row.station_name ?? row.name) || `${source.operatorName} ${source.country}`;
  const stationId = text(row.stationId ?? row.station_id ?? row.id) || stableStationId(source, stationName, index);
  const observedAt = text(row.observedAt ?? row.observed_at ?? row.validFrom ?? row.valid_from) || capturedAt;

  return {
    domain: 'ev_charging',
    stationId,
    stationName,
    operatorId: source.operatorId,
    operatorName: source.operatorName,
    country: source.country,
    latitude: numberOrNull(row.latitude ?? row.lat),
    longitude: numberOrNull(row.longitude ?? row.lng ?? row.lon),
    connectorTypes: stringList(row.connectorTypes ?? row.connector_types ?? row.connectors),
    maxPowerKw: numberOrNull(row.maxPowerKw ?? row.max_power_kw ?? row.powerKw ?? row.power),
    pricePerKwh,
    currency: source.currency,
    unit: 'kWh',
    idleFeePerMinute: moneyOrNull(row.idleFeePerMinute ?? row.idle_fee_per_minute ?? row.idleFee),
    sourceKind: source.sourceKind,
    sourceUrl: source.sourceUrl,
    observedAt,
    capturedAt,
    confidence: source.sourceKind === 'operator_station_feed' ? 0.9 : 0.85,
    provenance: {
      source: 'ev_charging_prices',
      parserVersion: 'ev-charging-prices-v1',
      rawSnapshotRef,
      rawOperator: source.operatorName,
      rawCountry: source.country
    }
  };
}

function parseJsonRows(body: string): RawEvChargingRow[] | null {
  try {
    const parsed = JSON.parse(body) as unknown;
    if (Array.isArray(parsed)) return parsed.filter(isObjectRecord);
    if (isObjectRecord(parsed)) {
      const rows = parsed.rows ?? parsed.prices ?? parsed.stations ?? parsed.tariffs;
      if (Array.isArray(rows)) return rows.filter(isObjectRecord);
    }
  } catch {
    return null;
  }
  return null;
}

function parseCsvRows(body: string): RawEvChargingRow[] | null {
  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2 || !lines[0]!.includes(',')) return null;
  const headers = splitCsvLine(lines[0]!).map((header) => header.trim());
  if (!headers.some((header) => /price|tariff|kwh/i.test(header))) return null;
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']));
  });
}

function parseTariffTextRows(body: string, source: EvChargingSourceConfig): RawEvChargingRow[] {
  const textBody = decodeHtmlText(body);
  const currencyAlternation = source.currency === 'EUR' ? '(?:€|EUR)' : `(?:${source.currency}|kr|kroner|kronor)`;
  const pattern = new RegExp(`(\\d+(?:[,.]\\d{1,2})?)\\s*${currencyAlternation}\\s*(?:/|per)?\\s*kWh`, 'i');
  const match = textBody.match(pattern);
  if (!match) return [];
  return [{ stationName: `${source.operatorName} ${source.country}`, pricePerKwh: match[1], observedAt: new Date().toISOString() }];
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]!;
    if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) {
      cells.push(current.trim());
      current = '';
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function decodeHtmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function stableStationId(source: EvChargingSourceConfig, stationName: string, index: number): string {
  return `ev-${source.operatorId}-${source.country.toLowerCase()}-${slug(stationName)}-${index}`;
}

function slug(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'station';
}

function moneyOrNull(value: unknown): number | null {
  const parsed = numberOrNull(typeof value === 'string' ? value.replace(/[^\d,.-]/g, '').replace(',', '.') : value);
  return parsed === null || parsed < 0 ? null : Math.round((parsed + Number.EPSILON) * 100) / 100;
}

function numberOrNull(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  const asText = text(value);
  return asText ? asText.split(/[|;,]/).map((item) => item.trim()).filter(Boolean) : [];
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isObjectRecord(value: unknown): value is RawEvChargingRow {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatDecimal(value: number): string {
  return value.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function contentHashFor(body: string): string {
  return createHash('sha256').update(body).digest('hex').slice(0, 24);
}
