import { createHash } from 'node:crypto';
import { runAllStoreTasks, type AllStoreTaskRunnerControls } from './all-store-runner.js';
import { fetchSt1FuelPrices, ST1_FUEL_PRICE_URL, type St1FuelGrade } from './st1-fuel.js';

export const SHELL_SE_STATIONS_URL = 'https://www.shell.se/bensinstationer.html';
export const SHELL_SE_ST1_STATION_LOCATOR_URL = 'https://st1.se/hitta-station';
export const SHELL_SE_PRICE_PARSER_VERSION = 'shell-se-st1-fuel-v1';
export const SHELL_SE_STATION_PARSER_VERSION = 'shell-se-st1-station-locator-v1';

export type ShellSeFuelGradeId = 'fuel-95-e10' | 'fuel-98' | 'fuel-diesel' | 'fuel-hvo100' | 'fuel-e85';

export type ShellSeFuelObservation = {
  domain: 'fuel';
  productId: ShellSeFuelGradeId;
  fuelGrade: '95' | '98' | 'diesel' | 'hvo100' | 'e85';
  gradeLabel: string;
  chainId: 'shell-se';
  operatorName: 'St1 Sverige AB';
  legacyBrandName: 'Shell Sverige';
  sourceKind: 'operator_public_price_page';
  sourceUrl: string;
  observedAt: string;
  capturedAt: string;
  effectiveFrom: string;
  pricePerLitre: number;
  currency: 'SEK';
  unit: 'l';
  confidence: number;
  provenance: {
    source: 'shell_se_st1_fuel_prices';
    sourceUrl: string;
    shellStatusUrl: string;
    parserVersion: string;
    rawSnapshotRef: string;
    originalTitle: string;
    originalPriceText: string;
    originalEffectiveDate: string;
    note: string;
  };
};

export type ShellSeStation = {
  chainId: 'shell-se';
  operatorName: 'St1 Sverige AB';
  legacyBrandName: 'Shell Sverige';
  stationId: string;
  name: string;
  latitude: number;
  longitude: number;
  openingHours: string;
  hasFuel: boolean;
  hasSelectConvenience: boolean;
  sourceUrl: string;
  retrievedAt: string;
  provenance: {
    parserVersion: string;
    note: string;
  };
};

export type ShellSeSelectConvenienceRow = {
  chainId: 'shell-se';
  stationId: string;
  productId: 'shell-select-convenience';
  name: 'Shell Select convenience food';
  categoryId: 'convenience-food';
  available: boolean;
  observedAt: string;
  sourceUrl: string;
  confidence: number;
  provenance: {
    parserVersion: string;
    note: string;
  };
};

type ShellGradeMapping = {
  st1Grade: St1FuelGrade;
  productId: ShellSeFuelGradeId;
  fuelGrade: ShellSeFuelObservation['fuelGrade'];
  gradeLabel: string;
};

const SHELL_GRADE_MAPPINGS: ShellGradeMapping[] = [
  { st1Grade: '95', productId: 'fuel-95-e10', fuelGrade: '95', gradeLabel: '95 E10 / Blyfri 95' },
  { st1Grade: '98', productId: 'fuel-98', fuelGrade: '98', gradeLabel: '98 / Blyfri 98' },
  { st1Grade: 'diesel', productId: 'fuel-diesel', fuelGrade: 'diesel', gradeLabel: 'Diesel' },
  { st1Grade: 'HVO100', productId: 'fuel-hvo100', fuelGrade: 'hvo100', gradeLabel: 'HVO100' },
  { st1Grade: 'E85', productId: 'fuel-e85', fuelGrade: 'e85', gradeLabel: 'E85' }
];

function contentHashFor(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 16);
}

function decodeHtmlText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\u002F/g, '/')
    .replace(/&nbsp;|\u00a0/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&ouml;/g, 'ö')
    .replace(/&aring;/g, 'å')
    .replace(/&auml;/g, 'ä')
    .replace(/\s+/g, ' ')
    .trim();
}

function textBetween(block: string, pattern: RegExp): string {
  const match = block.match(pattern);
  return match ? decodeHtmlText(match[1] ?? '') : '';
}

function stationIdFor(name: string, latitude: number, longitude: number): string {
  const slug = name.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `shell-se:${slug}:${latitude.toFixed(5)},${longitude.toFixed(5)}`;
}

function gradeMappingFor(grade: St1FuelGrade): ShellGradeMapping {
  const mapping = SHELL_GRADE_MAPPINGS.find((candidate) => candidate.st1Grade === grade);
  if (!mapping) throw new Error(`Unsupported Shell/St1 fuel grade: ${grade}`);
  return mapping;
}

export function parseShellSeStationLocatorHtml(input: {
  html: string;
  retrievedAt: string;
  sourceUrl?: string;
}): ShellSeStation[] {
  const sourceUrl = input.sourceUrl ?? SHELL_SE_ST1_STATION_LOCATOR_URL;
  const stations: ShellSeStation[] = [];
  const cardPattern = /<button\s+class="station"[\s\S]*?<\/button>/gi;
  for (const match of input.html.matchAll(cardPattern)) {
    const block = match[0];
    const name = textBetween(block, /<h4[^>]*class="title"[^>]*>([\s\S]*?)<\/h4>/i);
    const openingHours = textBetween(block, /<span[^>]*class="open-hours"[^>]*>([\s\S]*?)<\/span>/i);
    const coordinateMatch = block.match(/maps\.google\.com\/\?daddr=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
    if (!name || !coordinateMatch) continue;
    const latitude = Number(coordinateMatch[1]);
    const longitude = Number(coordinateMatch[2]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    const serviceText = decodeHtmlText(block).toLowerCase();
    const hasSelectConvenience = /\bselect\b|\bcaf[eé]\b|\bkaffe\b|\bshop\b|\bbutik\b|\bcup\b/i.test(serviceText) || /sprite-default-fill\/cup/i.test(block);
    stations.push({
      chainId: 'shell-se',
      operatorName: 'St1 Sverige AB',
      legacyBrandName: 'Shell Sverige',
      stationId: stationIdFor(name, latitude, longitude),
      name,
      latitude,
      longitude,
      openingHours,
      hasFuel: true,
      hasSelectConvenience,
      sourceUrl,
      retrievedAt: input.retrievedAt,
      provenance: {
        parserVersion: SHELL_SE_STATION_PARSER_VERSION,
        note: 'Shell Sweden stations were rebranded to St1; Shell.se directs users to St1 for the active station network.'
      }
    });
  }
  return stations;
}

export function mapSt1FuelPricesToShellSe(rows: Awaited<ReturnType<typeof fetchSt1FuelPrices>>, options: {
  capturedAt: string;
  sourceUrl?: string;
  shellStatusUrl?: string;
  rawSnapshotRef?: string;
  parserVersion?: string;
}): ShellSeFuelObservation[] {
  const sourceUrl = options.sourceUrl ?? ST1_FUEL_PRICE_URL;
  const shellStatusUrl = options.shellStatusUrl ?? SHELL_SE_STATIONS_URL;
  const rawSnapshotRef = options.rawSnapshotRef ?? `raw://shell-se-st1-fuel/${contentHashFor(JSON.stringify(rows))}`;
  const parserVersion = options.parserVersion ?? SHELL_SE_PRICE_PARSER_VERSION;
  return rows.map((row) => {
    const mapping = gradeMappingFor(row.grade);
    return {
      domain: 'fuel',
      productId: mapping.productId,
      fuelGrade: mapping.fuelGrade,
      gradeLabel: mapping.gradeLabel,
      chainId: 'shell-se',
      operatorName: 'St1 Sverige AB',
      legacyBrandName: 'Shell Sverige',
      sourceKind: 'operator_public_price_page',
      sourceUrl,
      observedAt: row.observedAt,
      capturedAt: options.capturedAt,
      effectiveFrom: row.validFrom,
      pricePerLitre: row.pricePerLitre,
      currency: 'SEK',
      unit: 'l',
      confidence: 0.9,
      provenance: {
        source: 'shell_se_st1_fuel_prices',
        sourceUrl,
        shellStatusUrl,
        parserVersion,
        rawSnapshotRef,
        originalTitle: row.label,
        originalPriceText: `${row.pricePerLitre.toFixed(2).replace('.', ',')} kr`,
        originalEffectiveDate: row.validFrom.slice(0, 10),
        note: 'Shell Sweden fuel and station operations are handled by St1 after the Swedish Shell rebrand.'
      }
    };
  });
}

export async function fetchShellSeFuelPrices(options: {
  fetchImpl?: typeof fetch;
  capturedAt?: string;
  sourceUrl?: string;
} = {}): Promise<ShellSeFuelObservation[]> {
  const capturedAt = options.capturedAt ?? new Date().toISOString();
  const rows = await fetchSt1FuelPrices({
    fetchImpl: options.fetchImpl,
    retrievedAt: capturedAt,
    sourceRunId: `shell-se-st1-fuel-${capturedAt.slice(0, 10)}`
  });
  return mapSt1FuelPricesToShellSe(rows, {
    capturedAt,
    sourceUrl: options.sourceUrl ?? ST1_FUEL_PRICE_URL
  });
}

export async function fetchShellSeStations(options: {
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrl?: string;
} = {}): Promise<ShellSeStation[]> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const sourceUrl = options.sourceUrl ?? SHELL_SE_ST1_STATION_LOCATOR_URL;
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const response = await fetchImpl(sourceUrl, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView shell-se connector (+https://github.com/SzeChunYiu/GroceryView)'
    }
  });
  if (response.status === 401 || response.status === 403 || response.status === 407 || response.status === 429) {
    throw new Error(`Shell SE/St1 station source blocked or unavailable: HTTP ${response.status}`);
  }
  if (!response.ok) throw new Error(`Shell SE/St1 station request failed: ${response.status}`);
  const html = await response.text();
  return parseShellSeStationLocatorHtml({ html, retrievedAt, sourceUrl });
}

export async function fetchShellSeSelectConvenienceForAllStations(options: AllStoreTaskRunnerControls & {
  stations?: readonly ShellSeStation[];
  fetchImpl?: typeof fetch;
  retrievedAt?: string;
  sourceUrl?: string;
} = {}): Promise<ShellSeSelectConvenienceRow[]> {
  const retrievedAt = options.retrievedAt ?? new Date().toISOString();
  const stations = options.stations ?? await fetchShellSeStations({
    fetchImpl: options.fetchImpl,
    retrievedAt,
    sourceUrl: options.sourceUrl
  });
  const result = await runAllStoreTasks({
    stores: stations.filter((station) => station.hasSelectConvenience),
    storeId: (station) => station.stationId,
    storeConcurrency: options.storeConcurrency,
    storeStartDelayMs: options.storeStartDelayMs,
    storeRetryAttempts: options.storeRetryAttempts,
    storeRetryBaseDelayMs: options.storeRetryBaseDelayMs,
    failOnStoreFailure: options.failOnStoreFailure,
    task: async (station) => {
      const row: ShellSeSelectConvenienceRow = {
        chainId: 'shell-se',
        stationId: station.stationId,
        productId: 'shell-select-convenience',
        name: 'Shell Select convenience food',
        categoryId: 'convenience-food',
        available: true,
        observedAt: retrievedAt,
        sourceUrl: station.sourceUrl,
        confidence: 0.75,
        provenance: {
          parserVersion: SHELL_SE_STATION_PARSER_VERSION,
          note: 'Availability is derived from Shell Select/service cues on the St1 station locator after the Shell Sweden rebrand; no menu prices are inferred.'
        }
      };
      return [row];
    }
  });
  return result.rows;
}
