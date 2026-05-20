import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeploymentReadinessReport,
  buildHostedSmokeCommandPlan,
  buildRollbackPlan,
  buildSecretRotationReadinessReport,
  summarizeSecretRotationReadinessReport,
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

  it('builds hosted smoke command plans without embedding secret token values', () => {
    const plan = buildHostedSmokeCommandPlan({
      serverUrl: 'https://api.groceryview.example/',
      webUrl: 'https://groceryview.example',
      includePostgresReadiness: true,
      metricsTokenEnvVar: 'PROD_METRICS_TOKEN',
      timeoutSeconds: 20,
      httpEvidenceOutputPath: '/var/tmp/http-smoke.json',
      readinessEvidenceOutputPath: '/var/tmp/readiness-smoke.json'
    });

    assert.deepEqual(plan, {
      commands: [
        'GROCERYVIEW_SERVER_URL=https://api.groceryview.example GROCERYVIEW_WEB_URL=https://groceryview.example GROCERYVIEW_TERMINAL_PRODUCT_ID=coffee HTTP_SMOKE_TIMEOUT_SECONDS=20 HOSTED_HTTP_SMOKE_OUTPUT_PATH=/var/tmp/http-smoke.json infra/scripts/smoke-hosted-http.sh',
        'GROCERYVIEW_SERVER_URL=https://api.groceryview.example METRICS_TOKEN=$PROD_METRICS_TOKEN READINESS_TIMEOUT_SECONDS=20 HOSTED_READINESS_SMOKE_OUTPUT_PATH=/var/tmp/readiness-smoke.json infra/scripts/smoke-hosted-readiness.sh'
      ],
      requiredSecrets: ['PROD_METRICS_TOKEN'],
      evidence: [
        'hosted_api_health',
        'hosted_product_terminal',
        'hosted_http_smoke_artifact',
        'hosted_web',
        'hosted_postgres_readiness',
        'hosted_postgres_readiness_artifact'
      ],
      artifacts: ['/var/tmp/http-smoke.json', '/var/tmp/readiness-smoke.json']
    });
  });

  it('blocks deployment when required secrets are missing, stale, or lack rotation ownership', () => {
    const report = buildSecretRotationReadinessReport({
      checkedAt: '2026-05-20T08:00:00.000Z',
      maxAgeDays: 90,
      requiredSecrets: ['DATABASE_URL', 'SESSION_SECRET', 'METRICS_TOKEN', 'BILLING_WEBHOOK_SECRET'],
      secrets: [
        {
          name: 'DATABASE_URL',
          present: true,
          rotatedAt: '2026-01-01T00:00:00.000Z',
          owner: 'platform'
        },
        {
          name: 'SESSION_SECRET',
          present: true,
          rotatedAt: '2026-05-01T00:00:00.000Z'
        },
        {
          name: 'METRICS_TOKEN',
          present: false,
          rotatedAt: '2026-05-01T00:00:00.000Z',
          owner: 'platform'
        }
      ]
    });

    assert.deepEqual(report, {
      status: 'blocked',
      blockers: [
        'secret_rotation_stale:DATABASE_URL',
        'secret_rotation_owner_missing:SESSION_SECRET',
        'secret_missing:METRICS_TOKEN',
        'secret_missing:BILLING_WEBHOOK_SECRET'
      ],
      readySecrets: [],
      requiredSecretCount: 4,
      summary: 'Secret rotation readiness is blocked until required deployment secrets are present, fresh, and owned.'
    });
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
      requiredSecrets: 4,
      totalBlockers: 3,
      missingSecrets: 1,
      staleSecrets: 1,
      ownerlessSecrets: 1,
      readySecrets: 1
    });
  });
});
