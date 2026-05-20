import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeploymentReadinessReport,
  buildRollbackPlan,
  summarizeDeploymentReadinessReport,
  summarizeGateBlockers,
  summarizeGateWarnings
} from '../index.js';

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
        'health_check_failed:api',
        'scheduled_job_failed:notification-worker',
        'rollback_plan_not_approved',
        'dns_not_configured',
        'observability_not_configured'
      ]),
      {
        total: 10,
        missingSecrets: 1,
        missingArtifacts: 1,
        releaseValidation: 1,
        smokeTests: 1,
        healthChecks: 1,
        scheduledJobs: 1,
        rollbackPlan: 1,
        deploymentPrerequisites: 3
      }
    );
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
});
