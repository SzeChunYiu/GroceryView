import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

const ZERO_ROW_ALERT_AFTER_MS = 24 * 60 * 60 * 1000;
const DEFAULT_ALERT_LOG_PATH = '/tmp/ingest-alerts.jsonl';
const DEFAULT_ZERO_ROW_STATE_PATH = '/tmp/ingest-zero-row-state.json';
const DEFAULT_WEBHOOK_ENV = 'INGEST_ALERT_WEBHOOK_URL';

export type IngestionConnector<T> = {
  id: string;
  run: () => Promise<readonly T[]>;
};

export type IngestionRunnerOptions = {
  now?: Date;
  alertLogPath?: string;
  zeroRowStatePath?: string;
  webhookUrl?: string;
  webhookEnvName?: string;
};

type ZeroRowState = Record<string, { firstZeroRowsAt: string; lastAlertedAt?: string }>;

type IngestionAlert = {
  type: 'connector_zero_rows_24h';
  connectorId: string;
  firstZeroRowsAt: string;
  observedAt: string;
  hoursWithoutRows: number;
};

async function readZeroRowState(path: string): Promise<ZeroRowState> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as ZeroRowState;
  } catch {
    return {};
  }
}

async function writeJsonFile(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function appendJsonLine(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(value)}\n`);
}

async function postWebhook(webhookUrl: string | undefined, alert: IngestionAlert) {
  if (!webhookUrl) return;

  const response = await fetch(webhookUrl, {
    body: JSON.stringify(alert),
    headers: { 'content-type': 'application/json' },
    method: 'POST'
  });

  if (!response.ok) {
    throw new Error(`Ingestion alert webhook failed with ${response.status}`);
  }
}

export async function emitIngestionAlert(alert: IngestionAlert, options: IngestionRunnerOptions = {}) {
  const alertLogPath = options.alertLogPath ?? DEFAULT_ALERT_LOG_PATH;
  const webhookUrl = options.webhookUrl ?? process.env[options.webhookEnvName ?? DEFAULT_WEBHOOK_ENV];

  await appendJsonLine(alertLogPath, alert);
  try {
    await postWebhook(webhookUrl, alert);
  } catch (error) {
    await appendJsonLine(alertLogPath, {
      ...alert,
      type: 'connector_zero_rows_24h',
      webhookDelivery: 'failed',
      webhookError: error instanceof Error ? error.message : String(error)
    });
  }
}

export async function runIngestionConnector<T>(connector: IngestionConnector<T>, options: IngestionRunnerOptions = {}) {
  const now = options.now ?? new Date();
  const zeroRowStatePath = options.zeroRowStatePath ?? DEFAULT_ZERO_ROW_STATE_PATH;
  const rows = await connector.run();
  const state = await readZeroRowState(zeroRowStatePath);

  if (rows.length > 0) {
    if (state[connector.id]) {
      delete state[connector.id];
      await writeJsonFile(zeroRowStatePath, state);
    }
    return rows;
  }

  const existing = state[connector.id];
  const firstZeroRowsAt = existing?.firstZeroRowsAt ?? now.toISOString();
  const zeroRowAgeMs = now.getTime() - new Date(firstZeroRowsAt).getTime();
  const hoursWithoutRows = zeroRowAgeMs / (60 * 60 * 1000);
  const lastAlertedAgeMs = existing?.lastAlertedAt ? now.getTime() - new Date(existing.lastAlertedAt).getTime() : Number.POSITIVE_INFINITY;
  const shouldAlert = zeroRowAgeMs > ZERO_ROW_ALERT_AFTER_MS && lastAlertedAgeMs > ZERO_ROW_ALERT_AFTER_MS;

  state[connector.id] = {
    firstZeroRowsAt,
    lastAlertedAt: shouldAlert ? now.toISOString() : existing?.lastAlertedAt
  };
  await writeJsonFile(zeroRowStatePath, state);

  if (shouldAlert) {
    await emitIngestionAlert({
      type: 'connector_zero_rows_24h',
      connectorId: connector.id,
      firstZeroRowsAt,
      observedAt: now.toISOString(),
      hoursWithoutRows: Number(hoursWithoutRows.toFixed(2))
    }, options);
  }

  return rows;
}
