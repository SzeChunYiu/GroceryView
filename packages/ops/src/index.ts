export type GateStatus = 'pass' | 'fail' | 'not_run';

export type LocalSmokeEnvOverride = {
  name: string;
  defaultValue: string;
  purpose: string;
};

export const localSmokeEnvOverrides: LocalSmokeEnvOverride[] = [
  {
    name: 'COMPOSE_FILE',
    defaultValue: 'infra/docker-compose.yml',
    purpose: 'Docker Compose file used for the local dependency stack.'
  },
  {
    name: 'POSTGRES_SERVICE',
    defaultValue: 'postgres',
    purpose: 'Compose service name for PostgreSQL/PostGIS readiness checks.'
  },
  {
    name: 'REDIS_SERVICE',
    defaultValue: 'redis',
    purpose: 'Compose service name for Redis readiness checks.'
  },
  {
    name: 'OBJECT_STORAGE_SERVICE',
    defaultValue: 'object-storage',
    purpose: 'Compose service name for MinIO health checks.'
  },
  {
    name: 'OBJECT_STORAGE_INIT_SERVICE',
    defaultValue: 'object-storage-init',
    purpose: 'Compose service name that creates and verifies the configured bucket.'
  },
  {
    name: 'POSTGRES_DB',
    defaultValue: 'groceryview',
    purpose: 'Database name used by the pg_isready probe.'
  },
  {
    name: 'POSTGRES_USER',
    defaultValue: 'groceryview',
    purpose: 'Database user used by the pg_isready probe.'
  },
  {
    name: 'S3_BUCKET',
    defaultValue: 'groceryview-raw',
    purpose: 'MinIO bucket that must exist before API or worker development.'
  },
  {
    name: 'WAIT_SECONDS',
    defaultValue: '90',
    purpose: 'Maximum seconds to wait for health checks before printing diagnostics.'
  }
];

export function listLocalSmokeEnvOverrideNames(): string[] {
  return localSmokeEnvOverrides.map((override) => override.name);
}

export type DeploymentReadinessInput = {
  providerSelected: boolean;
  requiredSecretsPresent: string[];
  requiredSecrets: string[];
  dnsConfigured: boolean;
  healthChecks: Array<{ name: string; status: GateStatus }>;
  smokeTests: Array<{ name: string; status: GateStatus }>;
  scheduledJobs?: Array<{ name: string; scheduleConfigured: boolean; status: GateStatus }>;
  changeFreeze?: {
    active: boolean;
    reason: string;
  };
  activeIncidents?: Array<{
    id: string;
    severity: 'sev1' | 'sev2' | 'sev3';
    status: 'investigating' | 'mitigating' | 'resolved';
  }>;
  observabilityConfigured: boolean;
};

export type DeploymentReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  warnings: string[];
  summary: string;
};

export type GateBlockerSummary = {
  total: number;
  missingSecrets: number;
  missingArtifacts: number;
  releaseValidation: number;
  smokeTests: number;
  healthChecks: number;
  scheduledJobs: number;
  changeControls: number;
  incidents: number;
  rollbackPlan: number;
  deploymentPrerequisites: number;
};

export type GateWarningSummary = {
  total: number;
  missingHealthCheckDefinitions: number;
  missingSmokeTestDefinitions: number;
};

export type DeploymentReadinessReportSummary = {
  status: DeploymentReadinessReport['status'];
  blockers: GateBlockerSummary;
  warnings: GateWarningSummary;
};

export function summarizeGateBlockers(blockers: string[]): GateBlockerSummary {
  return blockers.reduce<GateBlockerSummary>(
    (summary, blocker) => {
      summary.total += 1;
      if (blocker.startsWith('missing_secret:')) summary.missingSecrets += 1;
      if (blocker.startsWith('missing_artifact:')) summary.missingArtifacts += 1;
      if (blocker.startsWith('release_validation_')) summary.releaseValidation += 1;
      if (blocker.startsWith('smoke_test_') || blocker.startsWith('smoke_evidence_') || blocker === 'no_smoke_tests_defined') {
        summary.smokeTests += 1;
      }
      if (blocker.startsWith('health_check_')) summary.healthChecks += 1;
      if (blocker.startsWith('scheduled_job_')) summary.scheduledJobs += 1;
      if (blocker.startsWith('change_freeze_active:')) summary.changeControls += 1;
      if (blocker.startsWith('active_incident:')) summary.incidents += 1;
      if (blocker === 'rollback_plan_not_approved') summary.rollbackPlan += 1;
      if (blocker === 'hosting_provider_not_selected' || blocker === 'dns_not_configured' || blocker === 'observability_not_configured') {
        summary.deploymentPrerequisites += 1;
      }
      return summary;
    },
    {
      total: 0,
      missingSecrets: 0,
      missingArtifacts: 0,
      releaseValidation: 0,
      smokeTests: 0,
      healthChecks: 0,
      scheduledJobs: 0,
      changeControls: 0,
      incidents: 0,
      rollbackPlan: 0,
      deploymentPrerequisites: 0
    }
  );
}

export function summarizeGateWarnings(warnings: string[]): GateWarningSummary {
  return warnings.reduce<GateWarningSummary>(
    (summary, warning) => {
      summary.total += 1;
      if (warning === 'no_health_checks_defined') summary.missingHealthCheckDefinitions += 1;
      if (warning === 'no_smoke_tests_defined') summary.missingSmokeTestDefinitions += 1;
      return summary;
    },
    { total: 0, missingHealthCheckDefinitions: 0, missingSmokeTestDefinitions: 0 }
  );
}

export function summarizeDeploymentReadinessReport(report: DeploymentReadinessReport): DeploymentReadinessReportSummary {
  return {
    status: report.status,
    blockers: summarizeGateBlockers(report.blockers),
    warnings: summarizeGateWarnings(report.warnings)
  };
}

export function buildDeploymentReadinessReport(input: DeploymentReadinessInput): DeploymentReadinessReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const present = new Set(input.requiredSecretsPresent);

  if (!input.providerSelected) blockers.push('hosting_provider_not_selected');
  for (const secret of input.requiredSecrets) {
    if (!present.has(secret)) blockers.push(`missing_secret:${secret}`);
  }
  if (!input.dnsConfigured) blockers.push('dns_not_configured');

  for (const check of input.healthChecks) {
    if (check.status === 'fail') blockers.push(`health_check_failed:${check.name}`);
    if (check.status === 'not_run') blockers.push(`health_check_not_run:${check.name}`);
  }

  for (const smoke of input.smokeTests) {
    if (smoke.status === 'fail') blockers.push(`smoke_test_failed:${smoke.name}`);
    if (smoke.status === 'not_run') blockers.push(`smoke_test_not_run:${smoke.name}`);
  }

  for (const job of input.scheduledJobs ?? []) {
    if (!job.scheduleConfigured) blockers.push(`scheduled_job_schedule_not_configured:${job.name}`);
    if (job.status === 'fail') blockers.push(`scheduled_job_failed:${job.name}`);
    if (job.status === 'not_run') blockers.push(`scheduled_job_not_run:${job.name}`);
  }

  if (input.changeFreeze?.active) blockers.push(`change_freeze_active:${input.changeFreeze.reason}`);

  for (const incident of input.activeIncidents ?? []) {
    if ((incident.severity === 'sev1' || incident.severity === 'sev2') && incident.status !== 'resolved') {
      blockers.push(`active_incident:${incident.severity}:${incident.id}`);
    }
  }

  if (!input.observabilityConfigured) blockers.push('observability_not_configured');
  if (input.healthChecks.length === 0) warnings.push('no_health_checks_defined');
  if (input.smokeTests.length === 0) warnings.push('no_smoke_tests_defined');

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    warnings,
    summary: blockers.length === 0 ? 'Deployment readiness gates passed.' : 'Deployment is blocked until required gates pass.'
  };
}

export type RollbackPlanInput = {
  currentRelease: string;
  previousRelease: string;
  databaseMigration?: string;
  reversibleMigration: boolean;
};

export type RollbackPlan = {
  currentRelease: string;
  targetRelease: string;
  steps: string[];
  requiresManualDatabaseRecovery: boolean;
};

export type DeploymentSmokeEvidence = {
  name: string;
  status: GateStatus;
  checkedAt: string;
  url: string;
};

export type DeploymentSmokeEvidenceInput = {
  checkedAt: string;
  maxAgeMinutes: number;
  requiredSmokeTests: string[];
  evidence: DeploymentSmokeEvidence[];
};

export type DeploymentSmokeEvidenceReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  passed: string[];
  summary: string;
};

export function buildDeploymentSmokeEvidenceReport(input: DeploymentSmokeEvidenceInput): DeploymentSmokeEvidenceReport {
  const blockers: string[] = [];
  const passed: string[] = [];
  const evidenceByName = new Map(input.evidence.map((evidence) => [evidence.name, evidence]));
  const checkedAt = Date.parse(input.checkedAt);
  const maxAgeMs = input.maxAgeMinutes * 60 * 1000;

  for (const name of input.requiredSmokeTests) {
    const evidence = evidenceByName.get(name);
    if (!evidence) {
      blockers.push(`smoke_evidence_missing:${name}`);
      continue;
    }

    const evidenceCheckedAt = Date.parse(evidence.checkedAt);
    if (!Number.isFinite(evidenceCheckedAt) || !Number.isFinite(checkedAt) || checkedAt - evidenceCheckedAt > maxAgeMs) {
      blockers.push(`smoke_evidence_stale:${name}`);
    }

    if (evidence.status === 'pass') {
      passed.push(name);
    } else if (evidence.status === 'fail') {
      blockers.push(`smoke_evidence_failed:${name}`);
    } else {
      blockers.push(`smoke_evidence_not_run:${name}`);
    }

    if (!evidence.url) {
      blockers.push(`smoke_evidence_url_missing:${name}`);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    passed,
    summary:
      blockers.length === 0
        ? 'Deployment smoke evidence is fresh and passing.'
        : 'Deployment smoke evidence is blocked until every required probe has fresh passing proof.'
  };
}

export type HostedSmokeCommandPlanInput = {
  serverUrl: string;
  webUrl?: string;
  terminalProductId?: string;
  includePostgresReadiness: boolean;
  metricsTokenEnvVar?: string;
  timeoutSeconds?: number;
};

export type HostedSmokeCommandPlan = {
  commands: string[];
  requiredSecrets: string[];
  evidence: string[];
};

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

export function buildHostedSmokeCommandPlan(input: HostedSmokeCommandPlanInput): HostedSmokeCommandPlan {
  const timeout = input.timeoutSeconds ?? 15;
  const serverUrl = trimTrailingSlash(input.serverUrl);
  const terminalProductId = input.terminalProductId ?? 'coffee';
  const commands = [
    [
      `GROCERYVIEW_SERVER_URL=${serverUrl}`,
      input.webUrl ? `GROCERYVIEW_WEB_URL=${trimTrailingSlash(input.webUrl)}` : undefined,
      `GROCERYVIEW_TERMINAL_PRODUCT_ID=${terminalProductId}`,
      `HTTP_SMOKE_TIMEOUT_SECONDS=${timeout}`,
      'infra/scripts/smoke-hosted-http.sh'
    ]
      .filter(Boolean)
      .join(' ')
  ];
  const evidence = ['hosted_api_health', 'hosted_product_terminal'];
  const requiredSecrets: string[] = [];

  if (input.webUrl) evidence.push('hosted_web');

  if (input.includePostgresReadiness) {
    const metricsTokenEnvVar = input.metricsTokenEnvVar ?? 'METRICS_TOKEN';
    requiredSecrets.push(metricsTokenEnvVar);
    commands.push(
      [
        `GROCERYVIEW_SERVER_URL=${serverUrl}`,
        `METRICS_TOKEN=$${metricsTokenEnvVar}`,
        `READINESS_TIMEOUT_SECONDS=${timeout}`,
        'infra/scripts/smoke-hosted-readiness.sh'
      ].join(' ')
    );
    evidence.push('hosted_postgres_readiness');
  }

  return { commands, requiredSecrets, evidence };
}

export type SecretRotationRecord = {
  name: string;
  present: boolean;
  rotatedAt?: string;
  owner?: string;
};

export type SecretRotationReadinessInput = {
  checkedAt: string;
  maxAgeDays: number;
  requiredSecrets: string[];
  secrets: SecretRotationRecord[];
};

export type SecretRotationReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  readySecrets: string[];
  summary: string;
};

export type SecretRotationReadinessSummary = {
  status: SecretRotationReadinessReport['status'];
  totalBlockers: number;
  missingSecrets: number;
  staleSecrets: number;
  ownerlessSecrets: number;
  readySecrets: number;
};

export function buildSecretRotationReadinessReport(input: SecretRotationReadinessInput): SecretRotationReadinessReport {
  const checkedAt = Date.parse(input.checkedAt);
  const maxAgeMs = input.maxAgeDays * 24 * 60 * 60 * 1000;
  const secretsByName = new Map(input.secrets.map((secret) => [secret.name, secret]));
  const blockers: string[] = [];
  const readySecrets: string[] = [];

  for (const name of input.requiredSecrets) {
    const secret = secretsByName.get(name);
    if (!secret || !secret.present) {
      blockers.push(`secret_missing:${name}`);
      continue;
    }

    const rotatedAt = secret.rotatedAt ? Date.parse(secret.rotatedAt) : Number.NaN;
    if (!Number.isFinite(rotatedAt) || !Number.isFinite(checkedAt) || checkedAt - rotatedAt > maxAgeMs) {
      blockers.push(`secret_rotation_stale:${name}`);
    }

    if (!secret.owner) {
      blockers.push(`secret_rotation_owner_missing:${name}`);
    } else if (Number.isFinite(rotatedAt) && Number.isFinite(checkedAt) && checkedAt - rotatedAt <= maxAgeMs) {
      readySecrets.push(name);
    }
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    readySecrets,
    summary:
      blockers.length === 0
        ? 'Secret rotation readiness passed.'
        : 'Secret rotation readiness is blocked until required deployment secrets are present, fresh, and owned.'
  };
}

export function summarizeSecretRotationReadinessReport(
  report: SecretRotationReadinessReport
): SecretRotationReadinessSummary {
  return {
    status: report.status,
    totalBlockers: report.blockers.length,
    missingSecrets: report.blockers.filter((blocker) => blocker.startsWith('secret_missing:')).length,
    staleSecrets: report.blockers.filter((blocker) => blocker.startsWith('secret_rotation_stale:')).length,
    ownerlessSecrets: report.blockers.filter((blocker) => blocker.startsWith('secret_rotation_owner_missing:')).length,
    readySecrets: report.readySecrets.length
  };
}

export function buildRollbackPlan(input: RollbackPlanInput): RollbackPlan {
  const steps = [`Disable new traffic to release ${input.currentRelease}.`, `Restore application artifact ${input.previousRelease}.`];
  let requiresManualDatabaseRecovery = false;

  if (input.databaseMigration) {
    if (input.reversibleMigration) {
      steps.push(`Run down migration for ${input.databaseMigration}.`);
    } else {
      requiresManualDatabaseRecovery = true;
      steps.push(`Do not auto-revert irreversible migration ${input.databaseMigration}; run manual database recovery playbook.`);
    }
  }

  steps.push('Run smoke tests before re-enabling traffic.');
  return {
    currentRelease: input.currentRelease,
    targetRelease: input.previousRelease,
    steps,
    requiresManualDatabaseRecovery
  };
}

export type PartnerApiTier = 'trial' | 'growth' | 'enterprise';
export type PartnerApiExportFormat = 'json' | 'csv' | 'parquet';

export type PartnerApiAccessInput = {
  tier: PartnerApiTier;
  partnerName: string;
  issuedApiKeys: number;
  rateLimitPerMinute: number;
  allowedExportFormats: PartnerApiExportFormat[];
  includesPriceProvenance: boolean;
  includesRegionalAggregates: boolean;
  includesCategoryIndices: boolean;
  dataLatencyMinutes: number;
  signedDataProcessingAgreement: boolean;
};

export type PartnerApiAccessPlan = {
  status: 'ready' | 'blocked';
  tier: PartnerApiTier;
  partnerName: string;
  rateLimitPerMinute: number;
  enabledCapabilities: string[];
  exportFormats: PartnerApiExportFormat[];
  blockers: string[];
  summary: string;
};

const minimumRateLimitByTier: Record<PartnerApiTier, number> = {
  trial: 60,
  growth: 300,
  enterprise: 1200
};

export function buildPartnerApiAccessPlan(input: PartnerApiAccessInput): PartnerApiAccessPlan {
  const blockers: string[] = [];
  const enabledCapabilities: string[] = [];

  if (input.issuedApiKeys < 1) blockers.push('api_keys_not_issued');
  if (input.rateLimitPerMinute < minimumRateLimitByTier[input.tier]) blockers.push(`rate_limit_below_${input.tier}_minimum`);
  if (input.allowedExportFormats.length === 0) blockers.push('no_export_formats_enabled');
  if (!input.includesPriceProvenance) blockers.push('price_provenance_not_included');
  if (!input.signedDataProcessingAgreement) blockers.push('data_processing_agreement_not_signed');
  if (input.dataLatencyMinutes > 1440) blockers.push('data_latency_above_daily_sla');

  if (input.includesPriceProvenance) enabledCapabilities.push('price_provenance');
  if (input.includesRegionalAggregates) enabledCapabilities.push('regional_aggregates');
  if (input.includesCategoryIndices) enabledCapabilities.push('category_indices');
  if (input.dataLatencyMinutes <= 60) enabledCapabilities.push('hourly_refresh');
  if (input.dataLatencyMinutes <= 1440) enabledCapabilities.push('daily_refresh');

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    tier: input.tier,
    partnerName: input.partnerName,
    rateLimitPerMinute: input.rateLimitPerMinute,
    enabledCapabilities,
    exportFormats: [...input.allowedExportFormats].sort(),
    blockers,
    summary: blockers.length === 0 ? 'Partner API access is ready.' : 'Partner API access is blocked until required controls pass.'
  };
}
