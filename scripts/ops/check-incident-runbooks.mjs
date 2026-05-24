#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { performance } from 'node:perf_hooks';

const INCIDENTS = new Set([
  'ingestion-failure',
  'db-outage',
  'stale-data',
  'vercel-deploy-failure',
  'bad-source-parser',
  'api-latency-spike'
]);

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function result(incident, status, summary, evidence = {}, nextActions = []) {
  return { incident, status, summary, evidence, nextActions };
}

function commandExists(command) {
  const probe = spawnSync('sh', ['-lc', `command -v ${command}`], { encoding: 'utf8' });
  return probe.status === 0;
}

function run(command, args, options = {}) {
  const started = performance.now();
  const output = spawnSync(command, args, { encoding: 'utf8', timeout: options.timeout ?? 15_000, shell: false });
  return {
    command: [command, ...args].join(' '),
    exitCode: output.status,
    signal: output.signal,
    durationMs: Math.round(performance.now() - started),
    stdout: output.stdout?.trim().slice(0, 1200) ?? '',
    stderr: output.stderr?.trim().slice(0, 1200) ?? ''
  };
}

async function fetchJson(url, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const started = performance.now();
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json,text/plain,*/*' } });
    const text = await response.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* endpoint may be HTML/text */ }
    return {
      ok: response.ok,
      status: response.status,
      durationMs: Math.round(performance.now() - started),
      headers: {
        server: response.headers.get('server'),
        vercelId: response.headers.get('x-vercel-id'),
        cache: response.headers.get('x-vercel-cache')
      },
      json,
      textSample: text.slice(0, 500)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function checkIngestionFailure() {
  const evidence = {
    verifierScriptPresent: existsSync('scripts/ingestion/verify-ingested-provenance.mjs'),
    dailyConnectorScriptPresent: existsSync('scripts/ops/print-daily-connectors.mjs'),
    packageLockPresent: existsSync('package-lock.json')
  };
  if (!evidence.verifierScriptPresent) {
    return result('ingestion-failure', 'fail', 'Ingestion verifier script is missing.', evidence, ['Restore scripts/ingestion/verify-ingested-provenance.mjs or update the runbook check.']);
  }
  return result('ingestion-failure', 'pass', 'Ingestion verification commands are present and ready to run.', evidence, ['Run npm run ingest:verify against the incident environment.']);
}

function checkDbOutage() {
  const databaseUrl = process.env.DATABASE_URL || process.env.GROCERYVIEW_DATABASE_URL;
  const evidence = { databaseUrlConfigured: Boolean(databaseUrl), pgClientAvailable: commandExists('psql') };
  if (!databaseUrl) {
    return result('db-outage', 'unknown', 'No database URL is configured in this shell, so live DB health cannot be claimed.', evidence, ['Set DATABASE_URL or GROCERYVIEW_DATABASE_URL and rerun this check.']);
  }
  if (!evidence.pgClientAvailable) {
    return result('db-outage', 'unknown', 'Database URL is configured but psql is not available for a direct select 1 probe.', evidence, ['Install psql or run npm run ops:check-daily-db-connectivity in the production shell.']);
  }
  const probe = run('psql', [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-c', 'select 1 as groceryview_db_health;'], { timeout: 12_000 });
  evidence.probe = probe;
  return probe.exitCode === 0
    ? result('db-outage', 'pass', 'Database select 1 probe succeeded.', evidence)
    : result('db-outage', 'fail', 'Database select 1 probe failed.', evidence, ['Check provider status, connection limits, credentials, and recent migrations.']);
}

async function checkStaleData() {
  const url = process.env.GROCERYVIEW_FRESHNESS_URL;
  const maxAgeHours = Number(process.env.GROCERYVIEW_MAX_FRESHNESS_HOURS || 24);
  const evidence = { freshnessUrlConfigured: Boolean(url), maxAgeHours };
  if (!url) {
    return result('stale-data', 'unknown', 'No freshness URL configured; cannot claim live data freshness.', evidence, ['Set GROCERYVIEW_FRESHNESS_URL to a JSON endpoint with latestObservedAt/generatedAt/observedAt/updatedAt.']);
  }
  const response = await fetchJson(url);
  evidence.response = response;
  if (!response.ok) return result('stale-data', 'fail', 'Freshness endpoint returned a non-2xx status.', evidence, ['Inspect ingestion and API logs for the freshness endpoint.']);
  const timestamp = response.json?.latestObservedAt || response.json?.generatedAt || response.json?.observedAt || response.json?.updatedAt;
  evidence.timestamp = timestamp ?? null;
  const observedMs = timestamp ? Date.parse(timestamp) : NaN;
  if (!Number.isFinite(observedMs)) return result('stale-data', 'unknown', 'Freshness endpoint did not expose a recognized timestamp field.', evidence, ['Add latestObservedAt/generatedAt/observedAt/updatedAt to the endpoint or query DB directly.']);
  const ageHours = (Date.now() - observedMs) / 3_600_000;
  evidence.ageHours = Number(ageHours.toFixed(2));
  return ageHours <= maxAgeHours
    ? result('stale-data', 'pass', 'Freshness timestamp is within the configured SLO.', evidence)
    : result('stale-data', 'fail', 'Freshness timestamp exceeds the configured SLO.', evidence, ['Pause stale public claims and replay the affected connector after parser/source validation.']);
}

async function checkVercelDeployFailure() {
  const url = process.env.GROCERYVIEW_DEPLOY_URL || process.env.VERCEL_URL;
  const evidence = { deployUrlConfigured: Boolean(url) };
  if (!url) return result('vercel-deploy-failure', 'unknown', 'No deploy URL configured; cannot probe Vercel deployment status.', evidence, ['Set GROCERYVIEW_DEPLOY_URL to production or preview URL.']);
  const normalizedUrl = String(url).startsWith('http') ? String(url) : `https://${url}`;
  const response = await fetchJson(normalizedUrl, 12_000);
  evidence.url = normalizedUrl;
  evidence.response = response;
  return response.ok || (response.status >= 300 && response.status < 400)
    ? result('vercel-deploy-failure', 'pass', 'Deploy URL is serving an HTTP success/redirect response.', evidence)
    : result('vercel-deploy-failure', 'fail', 'Deploy URL is not serving a healthy HTTP response.', evidence, ['Open Vercel build/runtime logs and promote last known-good deployment if production is broken.']);
}

async function checkBadSourceParser() {
  const sampleUrl = process.env.GROCERYVIEW_PARSER_SAMPLE_URL;
  const evidence = {
    sampleUrlConfigured: Boolean(sampleUrl),
    ingestionConnectorsPresent: existsSync('packages/ingestion/src/connectors'),
    dailyConnectorPrinterPresent: existsSync('scripts/ops/print-daily-connectors.mjs')
  };
  if (!evidence.ingestionConnectorsPresent) return result('bad-source-parser', 'fail', 'Ingestion connector directory is missing.', evidence);
  if (!sampleUrl) return result('bad-source-parser', 'pass', 'Parser source tree and connector inventory command are present; no live sample URL was provided.', evidence, ['Set GROCERYVIEW_PARSER_SAMPLE_URL during a parser incident to capture live HTTP status and content-type.']);
  const response = await fetchJson(sampleUrl, 12_000);
  evidence.response = response;
  return response.ok
    ? result('bad-source-parser', 'pass', 'Parser sample URL returned a fetchable source response.', evidence, ['Capture/hash this response before parser edits.'])
    : result('bad-source-parser', 'fail', 'Parser sample URL is not fetchable.', evidence, ['Confirm robots/legal status and source availability before changing parser code.']);
}

async function checkApiLatencySpike() {
  const url = process.env.GROCERYVIEW_API_HEALTH_URL;
  const budgetMs = Number(process.env.GROCERYVIEW_API_LATENCY_BUDGET_MS || 1500);
  const evidence = { apiHealthUrlConfigured: Boolean(url), budgetMs };
  if (!url) return result('api-latency-spike', 'unknown', 'No API health URL configured; cannot measure live latency.', evidence, ['Set GROCERYVIEW_API_HEALTH_URL to the slow endpoint or a health route.']);
  const response = await fetchJson(url, Math.max(5000, budgetMs * 4));
  evidence.response = response;
  if (!response.ok) return result('api-latency-spike', 'fail', 'API endpoint returned a non-2xx response.', evidence, ['Inspect route logs and upstream DB/cache dependencies.']);
  return response.durationMs <= budgetMs
    ? result('api-latency-spike', 'pass', 'API endpoint latency is within budget for this probe.', evidence)
    : result('api-latency-spike', 'fail', 'API endpoint latency exceeds budget for this probe.', evidence, ['Run npm run ops:db-io-hotspots for DB-backed routes and inspect Vercel p95/p99.']);
}

const CHECKS = {
  'ingestion-failure': checkIngestionFailure,
  'db-outage': checkDbOutage,
  'stale-data': checkStaleData,
  'vercel-deploy-failure': checkVercelDeployFailure,
  'bad-source-parser': checkBadSourceParser,
  'api-latency-spike': checkApiLatencySpike
};

const selected = argValue('--incident');
if (selected && !INCIDENTS.has(selected)) {
  console.error(`Unknown incident '${selected}'. Expected one of: ${[...INCIDENTS].join(', ')}`);
  process.exit(2);
}

const incidents = selected ? [selected] : [...INCIDENTS];
const results = [];
for (const incident of incidents) {
  try {
    results.push(await CHECKS[incident]());
  } catch (error) {
    results.push(result(incident, 'fail', error instanceof Error ? error.message : String(error)));
  }
}

console.log(JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
process.exitCode = results.some((entry) => entry.status === 'fail') ? 1 : 0;
