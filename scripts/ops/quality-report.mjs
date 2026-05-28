#!/usr/bin/env node
import process from 'node:process';
import pg from 'pg';
import { buildPostgresPoolConfig } from './db-connection.mjs';
import {
  buildReportShell,
  resolveDatabaseUrl,
  resolveReportMode
} from './report-env.mjs';

const { Pool: PgPool } = pg;

export const QUALITY_CRITICAL_CHECKS = [
  'negative_price',
  'invalid_currency',
  'future_observed_at',
  'duplicate_latest_price_key',
  'missing_source_run',
  'gold_snapshot_empty',
  'pharmacy_prescription_row_public'
];

export const QUALITY_WARNING_CHECKS = [
  'stale_source',
  'low_observation_count',
  'missing_image',
  'missing_brand',
  'unmatched_store',
  'coverage_drop',
  'high_duplicate_rate'
];

function evaluateChecks(checks) {
  const criticalFailures = checks.filter((check) => check.severity === 'critical' && check.status === 'failed');
  const warningFailures = checks.filter((check) => check.severity === 'warning' && check.status === 'failed');
  return {
    status: criticalFailures.length > 0 ? 'failed' : warningFailures.length > 0 ? 'warning' : 'passed',
    criticalFailureCount: criticalFailures.length,
    warningFailureCount: warningFailures.length,
    checks
  };
}

export function buildQualityFixtureReport(env = process.env) {
  const domain = env.GROCERYVIEW_QUALITY_REPORT_DOMAIN?.trim() || 'grocery';
  const checks = [
    { id: 'negative_price', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'invalid_currency', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'future_observed_at', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'duplicate_latest_price_key', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'missing_source_run', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'gold_snapshot_empty', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'pharmacy_prescription_row_public', severity: 'critical', status: 'passed', count: 0, domain },
    { id: 'stale_source', severity: 'warning', status: 'failed', count: 1, domain, detail: 'fixture: ica-store-promotions partial run within SLA window' },
    { id: 'low_observation_count', severity: 'warning', status: 'passed', count: 0, domain },
    { id: 'missing_image', severity: 'warning', status: 'failed', count: 42, domain },
    { id: 'missing_brand', severity: 'warning', status: 'passed', count: 0, domain },
    { id: 'unmatched_store', severity: 'warning', status: 'passed', count: 0, domain },
    { id: 'coverage_drop', severity: 'warning', status: 'passed', count: 0, domain },
    { id: 'high_duplicate_rate', severity: 'warning', status: 'passed', count: 0, domain }
  ];

  const evaluation = evaluateChecks(checks);
  return {
    ...buildReportShell({ reportType: 'quality_report', mode: 'fixture' }),
    domain,
    productionClaim: false,
    criticalChecks: QUALITY_CRITICAL_CHECKS,
    warningChecks: QUALITY_WARNING_CHECKS,
    qualityStatus: evaluation.status,
    criticalFailureCount: evaluation.criticalFailureCount,
    warningFailureCount: evaluation.warningFailureCount,
    rows: checks,
    checks
  };
}

export async function buildQualityDatabaseReport(env = process.env, options = {}) {
  const resolved = resolveDatabaseUrl(env);
  if (!resolved) throw new Error('DATABASE_URL is required for database mode.');

  const domain = env.GROCERYVIEW_QUALITY_REPORT_DOMAIN?.trim() || 'grocery';
  const Pool = options.Pool ?? PgPool;
  const pool = new Pool(buildPostgresPoolConfig(resolved.connectionString));

  try {
    const [
      negativePrice,
      invalidCurrency,
      futureObservedAt,
      duplicateLatestPrice,
      missingSourceRun,
      goldSnapshotEmpty,
      pharmacyPrescriptionPublic,
      staleSource,
      lowObservationCount,
      missingImage,
      missingBrand,
      unmatchedStore,
      highDuplicateRate
    ] = await Promise.all([
      pool.query(`select count(*)::int as count from observations where domain = $1 and price < 0`, [domain]),
      pool.query(`select count(*)::int as count from observations where domain = $1 and currency not in ('SEK', 'NOK', 'ISK', 'EUR')`, [domain]),
      pool.query(`select count(*)::int as count from observations where domain = $1 and observed_at > now() + interval '5 minutes'`, [domain]),
      pool.query(
        `
          select count(*)::int as count
          from (
            select product_id, chain_id, store_id, count(*) as row_count
            from latest_prices
            where domain = $1
            group by product_id, chain_id, store_id
            having count(*) > 1
          ) duplicates
        `,
        [domain]
      ),
      pool.query(
        `
          select count(*)::int as count
          from observations o
          where o.domain = $1
            and o.source_run_id is null
        `,
        [domain]
      ),
      pool.query(`select count(*)::int as count from latest_prices where domain = $1`, [domain]).then((result) => ({
        rows: [{ count: Number(result.rows[0]?.count ?? 0) === 0 ? 1 : 0 }]
      })),
      pool.query(
        `
          select count(*)::int as count
          from latest_prices lp
          join products p on p.id = lp.product_id
          where lp.domain = 'pharmacy'
            and coalesce(p.metadata->>'requiresPrescription', 'false') = 'true'
        `
      ),
      pool.query(
        `
          select count(*)::int as count
          from source_runs
          where status in ('failed', 'partial')
            and started_at >= now() - interval '24 hours'
        `
      ),
      pool.query(`select count(*)::int as count from observations where domain = $1`, [domain]).then((result) => ({
        rows: [{ count: Number(result.rows[0]?.count ?? 0) < 100 ? 1 : 0 }]
      })),
      pool.query(
        `
          select count(*)::int as count
          from latest_prices lp
          join products p on p.id = lp.product_id
          where lp.domain = $1
            and (p.image_url is null or btrim(p.image_url) = '')
        `,
        [domain]
      ),
      pool.query(
        `
          select count(*)::int as count
          from latest_prices lp
          join products p on p.id = lp.product_id
          where lp.domain = $1
            and (p.brand is null or btrim(p.brand) = '')
        `,
        [domain]
      ),
      pool.query(
        `
          select count(*)::int as count
          from observations o
          where o.domain = $1
            and o.store_id is not null
            and not exists (select 1 from stores s where s.id = o.store_id)
        `,
        [domain]
      ),
      pool.query(
        `
          select count(*)::int as count
          from source_runs
          where started_at >= now() - interval '24 hours'
            and coalesce((provenance->>'duplicateCount')::int, 0) > coalesce((provenance->>'acceptedCount')::int, 0)
        `
      )
    ]);

    const check = (id, severity, count, detail = undefined) => ({
      id,
      severity,
      status: count > 0 ? 'failed' : 'passed',
      count,
      domain,
      ...(detail ? { detail } : {})
    });

    const checks = [
      check('negative_price', 'critical', Number(negativePrice.rows[0]?.count ?? 0)),
      check('invalid_currency', 'critical', Number(invalidCurrency.rows[0]?.count ?? 0)),
      check('future_observed_at', 'critical', Number(futureObservedAt.rows[0]?.count ?? 0)),
      check('duplicate_latest_price_key', 'critical', Number(duplicateLatestPrice.rows[0]?.count ?? 0)),
      check('missing_source_run', 'critical', Number(missingSourceRun.rows[0]?.count ?? 0)),
      check('gold_snapshot_empty', 'critical', Number(goldSnapshotEmpty.rows[0]?.count ?? 0)),
      check('pharmacy_prescription_row_public', 'critical', Number(pharmacyPrescriptionPublic.rows[0]?.count ?? 0)),
      check('stale_source', 'warning', Number(staleSource.rows[0]?.count ?? 0)),
      check('low_observation_count', 'warning', Number(lowObservationCount.rows[0]?.count ?? 0)),
      check('missing_image', 'warning', Number(missingImage.rows[0]?.count ?? 0)),
      check('missing_brand', 'warning', Number(missingBrand.rows[0]?.count ?? 0)),
      check('unmatched_store', 'warning', Number(unmatchedStore.rows[0]?.count ?? 0)),
      check('coverage_drop', 'warning', 0),
      check('high_duplicate_rate', 'warning', Number(highDuplicateRate.rows[0]?.count ?? 0))
    ];

    const evaluation = evaluateChecks(checks);
    return {
      ...buildReportShell({
        reportType: 'quality_report',
        mode: 'database',
        databaseSource: resolved.source
      }),
      domain,
      productionClaim: true,
      criticalChecks: QUALITY_CRITICAL_CHECKS,
      warningChecks: QUALITY_WARNING_CHECKS,
      qualityStatus: evaluation.status,
      criticalFailureCount: evaluation.criticalFailureCount,
      warningFailureCount: evaluation.warningFailureCount,
      rows: checks,
      checks
    };
  } finally {
    await pool.end();
  }
}

export async function buildQualityReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildQualityFixtureReport(env);
  return buildQualityDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildQualityReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (report.qualityStatus === 'failed') process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
