export type ConnectorCountryCode = 'SE' | 'NO' | 'IS';
export type ConnectorCurrency = 'SEK' | 'NOK' | 'ISK';
export type ConnectorSourceType = 'official_api' | 'retailer_online_page' | 'flyer_campaign' | 'operator_public_price_page';
export type ConnectorStage = 'fetch' | 'parse' | 'normalize' | 'persist';
export type ConnectorUnit = 'each' | 'kg' | 'g' | 'l' | 'ml' | 'metadata';

export type ConnectorLineage = {
  parserVersion: string;
  rawSnapshotRef: string;
  sourceUrl: string;
  retrievedAt: string;
  evidenceText?: string;
  contentDigest?: string;
};

export type ConnectorNormalizedRow = {
  id: string;
  chainId: string;
  countryCode: ConnectorCountryCode;
  currency: ConnectorCurrency;
  sourceType: ConnectorSourceType;
  productName: string;
  categoryId: string;
  price: number | null;
  unit: ConnectorUnit;
  sourceUrl: string;
  retrievedAt: string;
  parserVersion: string;
  rawSnapshotRef: string;
  lineage: ConnectorLineage;
};

export type ConnectorRunContext = {
  retrievedAt: string;
  sourceUrls: readonly string[];
  signal?: AbortSignal;
};

export type ConnectorPersistContext = ConnectorRunContext & {
  sourceRunId: string;
};

export type ConnectorRunResult<TNormalized extends ConnectorNormalizedRow> = {
  rows: TNormalized[];
  errors: ConnectorErrorSample[];
};

export type GroceryConnector<
  TRaw,
  TParsed,
  TNormalized extends ConnectorNormalizedRow,
  TPersistResult = unknown
> = {
  id: string;
  countryCode: ConnectorCountryCode;
  currency: ConnectorCurrency;
  sourceType: ConnectorSourceType;
  fetch(context: ConnectorRunContext): Promise<TRaw>;
  parse(raw: TRaw, context: ConnectorRunContext): TParsed[];
  normalize(parsed: readonly TParsed[], context: ConnectorRunContext): TNormalized[];
  persist?(rows: readonly TNormalized[], context: ConnectorPersistContext): Promise<TPersistResult>;
};

export type ConnectorErrorSample = {
  stage: ConnectorStage;
  message: string;
  sourceUrl?: string;
  retryable?: boolean;
};

export type ConnectorConformanceInput<TNormalized extends ConnectorNormalizedRow = ConnectorNormalizedRow> = {
  connectorId: string;
  countryCode: ConnectorCountryCode;
  currency: ConnectorCurrency;
  parserVersion: string;
  rows: readonly TNormalized[];
  errors?: readonly ConnectorErrorSample[];
  allowedUnits?: readonly ConnectorUnit[];
  maxFreshnessAgeHours?: number;
  now?: string;
};

export type ConnectorConformanceReport = {
  connectorId: string;
  checkedAt: string;
  rowCount: number;
  errorCount: number;
  issues: string[];
};

const connectorStages: readonly ConnectorStage[] = ['fetch', 'parse', 'normalize', 'persist'];
const connectorSourceTypes: readonly ConnectorSourceType[] = ['official_api', 'retailer_online_page', 'flyer_campaign', 'operator_public_price_page'];
const defaultAllowedUnits: readonly ConnectorUnit[] = ['each', 'kg', 'g', 'l', 'ml', 'metadata'];

function isParseableDate(value: string) {
  return !Number.isNaN(Date.parse(value));
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

function nonEmpty(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateLineage(row: ConnectorNormalizedRow, rowIndex: number, issues: string[]) {
  if (row.lineage.parserVersion !== row.parserVersion) issues.push(`rows[${rowIndex}].lineage.parserVersion must match parserVersion`);
  if (row.lineage.rawSnapshotRef !== row.rawSnapshotRef) issues.push(`rows[${rowIndex}].lineage.rawSnapshotRef must match rawSnapshotRef`);
  if (row.lineage.sourceUrl !== row.sourceUrl) issues.push(`rows[${rowIndex}].lineage.sourceUrl must match sourceUrl`);
  if (row.lineage.retrievedAt !== row.retrievedAt) issues.push(`rows[${rowIndex}].lineage.retrievedAt must match retrievedAt`);
  if (!nonEmpty(row.lineage.rawSnapshotRef)) issues.push(`rows[${rowIndex}].lineage.rawSnapshotRef is required`);
  if (!nonEmpty(row.lineage.parserVersion)) issues.push(`rows[${rowIndex}].lineage.parserVersion is required`);
}

function validateFreshness(row: ConnectorNormalizedRow, rowIndex: number, maxAgeHours: number | undefined, now: string, issues: string[]) {
  if (!isParseableDate(row.retrievedAt)) {
    issues.push(`rows[${rowIndex}].retrievedAt must be parseable`);
    return;
  }
  if (maxAgeHours === undefined) return;

  const retrievedAtMs = Date.parse(row.retrievedAt);
  const nowMs = Date.parse(now);
  if (!Number.isFinite(nowMs)) {
    issues.push('now must be parseable when maxFreshnessAgeHours is set');
    return;
  }
  if (retrievedAtMs > nowMs) issues.push(`rows[${rowIndex}].retrievedAt cannot be in the future`);
  const ageHours = (nowMs - retrievedAtMs) / 3_600_000;
  if (ageHours > maxAgeHours) issues.push(`rows[${rowIndex}].retrievedAt exceeds max freshness age of ${maxAgeHours}h`);
}

function validateRow(row: ConnectorNormalizedRow, rowIndex: number, input: Required<Pick<ConnectorConformanceInput, 'countryCode' | 'currency' | 'parserVersion'>> & Pick<ConnectorConformanceInput, 'allowedUnits' | 'maxFreshnessAgeHours' | 'now'>, issues: string[]) {
  for (const field of ['id', 'chainId', 'productName', 'categoryId', 'sourceUrl', 'retrievedAt', 'parserVersion', 'rawSnapshotRef'] as const) {
    if (!nonEmpty(row[field])) issues.push(`rows[${rowIndex}].${field} is required`);
  }
  if (row.countryCode !== input.countryCode) issues.push(`rows[${rowIndex}].countryCode must be ${input.countryCode}`);
  if (row.currency !== input.currency) issues.push(`rows[${rowIndex}].currency must be ${input.currency}`);
  if (row.parserVersion !== input.parserVersion) issues.push(`rows[${rowIndex}].parserVersion must be ${input.parserVersion}`);
  if (!connectorSourceTypes.includes(row.sourceType)) issues.push(`rows[${rowIndex}].sourceType must be a connector source type`);
  if (!isHttpUrl(row.sourceUrl)) issues.push(`rows[${rowIndex}].sourceUrl must be an HTTP URL`);
  if (!input.allowedUnits?.includes(row.unit)) issues.push(`rows[${rowIndex}].unit must be one of ${input.allowedUnits?.join(', ')}`);
  if (row.price !== null && (!Number.isFinite(row.price) || row.price < 0)) issues.push(`rows[${rowIndex}].price must be null or a non-negative finite number`);
  validateFreshness(row, rowIndex, input.maxFreshnessAgeHours, input.now ?? new Date().toISOString(), issues);
  validateLineage(row, rowIndex, issues);
}

function validateErrorSample(error: ConnectorErrorSample, index: number, issues: string[]) {
  if (!connectorStages.includes(error.stage)) issues.push(`errors[${index}].stage must be a connector stage`);
  if (!nonEmpty(error.message)) issues.push(`errors[${index}].message is required`);
  if (error.sourceUrl !== undefined && !isHttpUrl(error.sourceUrl)) issues.push(`errors[${index}].sourceUrl must be an HTTP URL`);
}

export function validateConnectorConformance<TNormalized extends ConnectorNormalizedRow>(input: ConnectorConformanceInput<TNormalized>): ConnectorConformanceReport {
  const issues: string[] = [];
  if (!nonEmpty(input.connectorId)) issues.push('connectorId is required');
  if (input.rows.length === 0) issues.push('at least one normalized row is required');

  const rowInput = {
    countryCode: input.countryCode,
    currency: input.currency,
    parserVersion: input.parserVersion,
    allowedUnits: input.allowedUnits ?? defaultAllowedUnits,
    maxFreshnessAgeHours: input.maxFreshnessAgeHours,
    now: input.now
  };
  input.rows.forEach((row, index) => validateRow(row, index, rowInput, issues));
  input.errors?.forEach((error, index) => validateErrorSample(error, index, issues));

  return {
    connectorId: input.connectorId,
    checkedAt: input.now ?? new Date().toISOString(),
    rowCount: input.rows.length,
    errorCount: input.errors?.length ?? 0,
    issues
  };
}

export function assertConnectorConformance<TNormalized extends ConnectorNormalizedRow>(input: ConnectorConformanceInput<TNormalized>): ConnectorConformanceReport {
  const report = validateConnectorConformance(input);
  if (report.issues.length > 0) {
    throw new Error(`Connector conformance failed for ${input.connectorId}: ${report.issues.join('; ')}`);
  }
  return report;
}
