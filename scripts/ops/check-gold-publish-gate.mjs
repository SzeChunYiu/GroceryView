#!/usr/bin/env node
import process from 'node:process';
import { buildQualityFixtureReport, buildQualityReport } from './quality-report.mjs';
import { buildSourceRunFixtureReport, buildSourceRunReport } from './source-run-report.mjs';
import { buildReportShell, resolveReportMode } from './report-env.mjs';

export const GOLD_PUBLISH_CRITICAL_GATES = [
  'quality_critical_checks_passed',
  'source_runs_not_all_failed',
  'gold_snapshot_non_empty',
  'no_forbidden_domain_claim'
];

function evaluateGoldPublishGate({ qualityReport, sourceRunReport, domain, region }) {
  const blockers = [];
  const warnings = [];
  const qualityStatus = qualityReport.qualityStatus ?? qualityReport.status;

  if (qualityStatus === 'failed') {
    blockers.push('quality_critical_checks_failed');
  } else if (qualityStatus === 'warning') {
    warnings.push('quality_warning_checks_failed');
  }

  if (sourceRunReport.summary.runCount === 0) {
    blockers.push('no_recent_source_runs');
  } else if (sourceRunReport.summary.failedRunCount === sourceRunReport.summary.runCount) {
    blockers.push('all_recent_source_runs_failed');
  } else if (sourceRunReport.summary.partialRunCount > 0) {
    warnings.push('partial_source_runs_present');
  }

  const goldSnapshotCheck = qualityReport.checks.find((check) => check.id === 'gold_snapshot_empty');
  if (goldSnapshotCheck?.status === 'failed') {
    blockers.push('gold_snapshot_empty');
  }

  const pharmacyCheck = qualityReport.checks.find((check) => check.id === 'pharmacy_prescription_row_public');
  if (pharmacyCheck?.status === 'failed') {
    blockers.push('forbidden_domain_claim');
  }

  const gateStatus = blockers.length > 0 ? 'blocked' : warnings.length > 0 ? 'ready_with_warnings' : 'ready';
  return {
    gateStatus,
    domain,
    region,
    publishAllowed: blockers.length === 0,
    blockers,
    warnings,
    criticalGates: GOLD_PUBLISH_CRITICAL_GATES,
    qualityReportStatus: qualityStatus,
    sourceRunSummary: sourceRunReport.summary
  };
}

export function buildGoldPublishFixtureReport(env = process.env) {
  const domain = env.GROCERYVIEW_GOLD_PUBLISH_DOMAIN?.trim() || 'grocery';
  const region = env.GROCERYVIEW_GOLD_PUBLISH_REGION?.trim() || 'SE';
  const scenario = env.GROCERYVIEW_GOLD_PUBLISH_FIXTURE_SCENARIO?.trim().toLowerCase() || 'ready';

  const qualityReport =
    scenario === 'blocked'
      ? {
          ...buildQualityFixtureReport(env),
          qualityStatus: 'failed',
          criticalFailureCount: 1,
          checks: buildQualityFixtureReport(env).checks.map((check) =>
            check.id === 'gold_snapshot_empty'
              ? { ...check, status: 'failed', count: 1, detail: 'fixture blocked scenario' }
              : check
          )
        }
      : buildQualityFixtureReport(env);

  const sourceRunReport =
    scenario === 'blocked'
      ? {
          ...buildSourceRunFixtureReport(env),
          rows: buildSourceRunFixtureReport(env).rows.map((row) => ({ ...row, status: 'failed' })),
          summary: {
            ...buildSourceRunFixtureReport(env).summary,
            byStatus: { failed: buildSourceRunFixtureReport(env).summary.runCount },
            failedRunCount: buildSourceRunFixtureReport(env).summary.runCount
          }
        }
      : buildSourceRunFixtureReport(env);

  const gate = evaluateGoldPublishGate({ qualityReport, sourceRunReport, domain, region });
  return {
    ...buildReportShell({ reportType: 'gold_publish_gate_report', mode: 'fixture' }),
    productionClaim: false,
    fixtureScenario: scenario,
    ...gate,
    rows: [gate],
    qualityReport: {
      status: qualityReport.status,
      qualityStatus: qualityReport.qualityStatus ?? qualityReport.status,
      criticalFailureCount: qualityReport.criticalFailureCount,
      warningFailureCount: qualityReport.warningFailureCount
    },
    sourceRunReport: {
      runCount: sourceRunReport.summary.runCount,
      failedRunCount: sourceRunReport.summary.failedRunCount,
      partialRunCount: sourceRunReport.summary.partialRunCount
    }
  };
}

export async function buildGoldPublishDatabaseReport(env = process.env, options = {}) {
  const domain = env.GROCERYVIEW_GOLD_PUBLISH_DOMAIN?.trim() || 'grocery';
  const region = env.GROCERYVIEW_GOLD_PUBLISH_REGION?.trim() || 'SE';
  const [qualityReport, sourceRunReport] = await Promise.all([
    buildQualityReport(env, options),
    buildSourceRunReport(env, options)
  ]);

  const gate = evaluateGoldPublishGate({ qualityReport, sourceRunReport, domain, region });
  return {
    ...buildReportShell({
      reportType: 'gold_publish_gate_report',
      mode: 'database',
      databaseSource: resolveReportMode(env) === 'database' ? 'configured' : null
    }),
    productionClaim: true,
    ...gate,
    rows: [gate],
    qualityReport: {
      status: qualityReport.status,
      qualityStatus: qualityReport.qualityStatus ?? qualityReport.status,
      criticalFailureCount: qualityReport.criticalFailureCount,
      warningFailureCount: qualityReport.warningFailureCount
    },
    sourceRunReport: {
      runCount: sourceRunReport.summary.runCount,
      failedRunCount: sourceRunReport.summary.failedRunCount,
      partialRunCount: sourceRunReport.summary.partialRunCount
    }
  };
}

export async function buildGoldPublishGateReport(env = process.env, options = {}) {
  const mode = resolveReportMode(env);
  if (mode === 'fixture') return buildGoldPublishFixtureReport(env);
  return buildGoldPublishDatabaseReport(env, options);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const report = await buildGoldPublishGateReport(process.env);
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (!report.publishAllowed) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
