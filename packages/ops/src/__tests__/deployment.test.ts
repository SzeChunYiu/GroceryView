import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildDeploymentReadinessReport, buildRollbackPlan, buildTrafficRampPlan } from '../index.js';

describe('deployment ops foundation', () => {
  it('passes readiness only when provider, secrets, DNS, health checks, and smoke tests are ready', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      dnsConfigured: true,
      healthChecks: [
        { name: 'web', status: 'pass' },
        { name: 'api', status: 'pass' }
      ],
      smokeTests: [
        { name: 'market-page', status: 'pass' },
        { name: 'health-endpoint', status: 'pass' }
      ],
      observabilityConfigured: true
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      warnings: [],
      summary: 'Deployment readiness gates passed.'
    });
  });

  it('fails closed with concrete blockers when deployment prerequisites are missing', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: false,
      requiredSecretsPresent: ['SESSION_SECRET'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      dnsConfigured: false,
      healthChecks: [{ name: 'api', status: 'fail' }],
      smokeTests: [{ name: 'market-page', status: 'not_run' }],
      observabilityConfigured: false
    });

    assert.deepEqual(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'hosting_provider_not_selected',
      'missing_secret:DATABASE_URL',
      'missing_secret:PUBLIC_APP_URL',
      'dns_not_configured',
      'health_check_failed:api',
      'smoke_test_not_run:market-page',
      'observability_not_configured'
    ]);
  });

  it('gates production readiness on scheduled background workers', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      scheduledJobs: [
        { name: 'notification-worker', scheduleConfigured: false, status: 'not_run' },
        { name: 'catalog-backfill', scheduleConfigured: true, status: 'fail' }
      ],
      observabilityConfigured: true
    });

    assert.deepEqual(report.status, 'blocked');
    assert.deepEqual(report.blockers, [
      'scheduled_job_schedule_not_configured:notification-worker',
      'scheduled_job_not_run:notification-worker',
      'scheduled_job_failed:catalog-backfill'
    ]);
  });

  it('accepts ready scheduled background workers as deployment evidence', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      scheduledJobs: [{ name: 'notification-worker', scheduleConfigured: true, status: 'pass' }],
      observabilityConfigured: true
    });

    assert.deepEqual(report, {
      status: 'ready',
      blockers: [],
      warnings: [],
      summary: 'Deployment readiness gates passed.'
    });
  });

  it('summarizes gate blockers for deployment dashboards', () => {
    assert.deepEqual(
      summarizeGateBlockers([
        'hosting_provider_not_selected',
        'missing_secret:DATABASE_URL',
        'missing_artifact:api-image',
        'release_validation_fail',
        'smoke_test_not_run:api-health',
        'smoke_evidence_stale:hosted_api_health',
        'health_check_failed:api',
        'scheduled_job_failed:notification-worker',
        'change_freeze_active:holiday-freeze',
        'active_incident:sev1:inc-123',
        'rollback_plan_not_approved',
        'dns_not_configured',
        'observability_not_configured'
      ]),
      {
        total: 13,
        missingSecrets: 1,
        missingArtifacts: 1,
        releaseValidation: 1,
        smokeTests: 2,
        healthChecks: 1,
        scheduledJobs: 1,
        changeControls: 1,
        incidents: 1,
        rollbackPlan: 1,
        deploymentPrerequisites: 3
      }
    );
  });

  it('surfaces change freezes and active severe incidents as deployment blockers', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL'],
      requiredSecrets: ['DATABASE_URL'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      changeFreeze: { active: true, reason: 'holiday-freeze' },
      activeIncidents: [
        { id: 'inc-123', severity: 'sev1', status: 'mitigating' },
        { id: 'inc-456', severity: 'sev3', status: 'investigating' },
        { id: 'inc-789', severity: 'sev2', status: 'resolved' }
      ],
      observabilityConfigured: true
    });

    assert.deepEqual(report.status, 'blocked');
    assert.deepEqual(report.blockers, ['change_freeze_active:holiday-freeze', 'active_incident:sev1:inc-123']);
    assert.deepEqual(summarizeDeploymentReadinessReport(report).blockers, {
      total: 2,
      missingSecrets: 0,
      missingArtifacts: 0,
      releaseValidation: 0,
      smokeTests: 0,
      healthChecks: 0,
      scheduledJobs: 0,
      changeControls: 1,
      incidents: 1,
      rollbackPlan: 0,
      deploymentPrerequisites: 0
    });
  });

  it('summarizes readiness warnings and full readiness reports', () => {
    const report = buildDeploymentReadinessReport({
      providerSelected: false,
      requiredSecretsPresent: [],
      requiredSecrets: ['DATABASE_URL'],
      dnsConfigured: false,
      healthChecks: [],
      smokeTests: [],
      scheduledJobs: [{ name: 'notification-worker', scheduleConfigured: false, status: 'not_run' }],
      observabilityConfigured: false
    });

    assert.deepEqual(summarizeGateWarnings(report.warnings), {
      total: 2,
      missingHealthCheckDefinitions: 1,
      missingSmokeTestDefinitions: 1
    });
    assert.deepEqual(summarizeDeploymentReadinessReport(report), {
      status: 'blocked',
      blockers: {
        total: 6,
        missingSecrets: 1,
        missingArtifacts: 0,
        releaseValidation: 0,
        smokeTests: 0,
        healthChecks: 0,
        scheduledJobs: 2,
        changeControls: 0,
        incidents: 0,
        rollbackPlan: 0,
        deploymentPrerequisites: 3
      },
      warnings: {
        total: 2,
        missingHealthCheckDefinitions: 1,
        missingSmokeTestDefinitions: 1
      }
    });
  });

  it('builds rollback instructions pinned to previous artifact and database state', () => {
    const plan = buildRollbackPlan({
      currentRelease: '2026-05-19.3',
      previousRelease: '2026-05-19.2',
      databaseMigration: '2026051903_add_scanning',
      reversibleMigration: false
    });

    assert.deepEqual(plan, {
      currentRelease: '2026-05-19.3',
      targetRelease: '2026-05-19.2',
      steps: [
        'Disable new traffic to release 2026-05-19.3.',
        'Restore application artifact 2026-05-19.2.',
        'Do not auto-revert irreversible migration 2026051903_add_scanning; run manual database recovery playbook.',
        'Run smoke tests before re-enabling traffic.'
      ],
      requiresManualDatabaseRecovery: true
    });
  });

  it('builds a staged traffic ramp with per-stage rollback triggers', () => {
    const readiness = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'PUBLIC_APP_URL'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      observabilityConfigured: true
    });

    const plan = buildTrafficRampPlan({
      release: '2026-05-20.1',
      previousRelease: '2026-05-19.3',
      readiness,
      stages: [
        { trafficPercent: 10, holdMinutes: 15, requiredChecks: ['api-health', 'error-rate'] },
        { trafficPercent: 50, holdMinutes: 20, requiredChecks: ['checkout-smoke', 'latency-p95'] },
        { trafficPercent: 100, holdMinutes: 30, requiredChecks: ['synthetic-market-page', 'worker-heartbeat'] }
      ],
      reversibleMigration: true
    });

    assert.deepEqual(plan.status, 'ready');
    assert.deepEqual(plan.blockers, []);
    assert.deepEqual(plan.stages[0], {
      trafficPercent: 10,
      holdMinutes: 15,
      actions: ['Shift 10% traffic to release 2026-05-20.1.', 'Hold for 15 minutes.', 'Verify api-health, error-rate.'],
      rollbackTrigger: 'Rollback to 2026-05-19.3 if api-health, error-rate fails during the 10% ramp.'
    });
    assert.deepEqual(plan.stages[2].actions, [
      'Shift 100% traffic to release 2026-05-20.1.',
      'Hold for 30 minutes.',
      'Verify synthetic-market-page, worker-heartbeat.'
    ]);
    assert.deepEqual(plan.rollback.targetRelease, '2026-05-19.3');
    assert.deepEqual(plan.summary, 'Traffic ramp for 2026-05-20.1 is ready across 3 stages.');
  });

  it('blocks traffic ramp planning when readiness gates are blocked', () => {
    const readiness = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL'],
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      observabilityConfigured: true
    });

    const plan = buildTrafficRampPlan({
      release: '2026-05-20.1',
      previousRelease: '2026-05-19.3',
      readiness,
      stages: [{ trafficPercent: 100, holdMinutes: 15, requiredChecks: ['api-health'] }],
      reversibleMigration: true
    });

    assert.deepEqual(plan, {
      status: 'blocked',
      release: '2026-05-20.1',
      blockers: ['missing_secret:SESSION_SECRET'],
      stages: [],
      rollback: {
        currentRelease: '2026-05-20.1',
        targetRelease: '2026-05-19.3',
        steps: [
          'Disable new traffic to release 2026-05-20.1.',
          'Restore application artifact 2026-05-19.3.',
          'Run smoke tests before re-enabling traffic.'
        ],
        requiresManualDatabaseRecovery: false
      },
      summary: 'Traffic ramp is blocked until deployment readiness gates pass.'
    });
  });

  it('rejects unsafe traffic ramp stage definitions', () => {
    const readiness = buildDeploymentReadinessReport({
      providerSelected: true,
      requiredSecretsPresent: ['DATABASE_URL'],
      requiredSecrets: ['DATABASE_URL'],
      dnsConfigured: true,
      healthChecks: [{ name: 'api', status: 'pass' }],
      smokeTests: [{ name: 'health-endpoint', status: 'pass' }],
      observabilityConfigured: true
    });

    assert.throws(
      () =>
        buildTrafficRampPlan({
          release: '2026-05-20.1',
          previousRelease: '2026-05-19.3',
          readiness,
          stages: [
            { trafficPercent: 50, holdMinutes: 15, requiredChecks: ['api-health'] },
            { trafficPercent: 50, holdMinutes: 15, requiredChecks: ['api-health'] }
          ],
          reversibleMigration: true
        }),
      /trafficPercent values must strictly increase/
    );

    assert.throws(
      () =>
        buildTrafficRampPlan({
          release: '2026-05-20.1',
          previousRelease: '2026-05-19.3',
          readiness,
          stages: [{ trafficPercent: 90, holdMinutes: 15, requiredChecks: ['api-health'] }],
          reversibleMigration: true
        }),
      /Final traffic ramp stage must reach 100 percent/
    );
  });

  it('summarizes secret rotation readiness for deployment dashboards', () => {
    const report = buildSecretRotationReadinessReport({
      checkedAt: '2026-05-20T08:00:00.000Z',
      maxAgeDays: 90,
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'METRICS_TOKEN', 'PUBLIC_APP_URL'],
      secrets: [
        { name: 'DATABASE_URL', present: true, rotatedAt: '2026-01-01T00:00:00.000Z', owner: 'platform' },
        { name: 'SESSION_SECRET', present: true, rotatedAt: '2026-05-01T00:00:00.000Z' },
        { name: 'PUBLIC_APP_URL', present: true, rotatedAt: '2026-05-01T00:00:00.000Z', owner: 'platform' }
      ]
    });

    assert.deepEqual(summarizeSecretRotationReadinessReport(report), {
      status: 'blocked',
      totalBlockers: 3,
      missingSecrets: 1,
      staleSecrets: 1,
      ownerlessSecrets: 1,
      readySecrets: 1
    });
  });
});
