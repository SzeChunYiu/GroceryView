export type GateStatus = 'pass' | 'fail' | 'not_run';

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
      if (blocker.startsWith('smoke_test_') || blocker === 'no_smoke_tests_defined') summary.smokeTests += 1;
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
  const commands = [
    [
      `GROCERYVIEW_SERVER_URL=${serverUrl}`,
      input.webUrl ? `GROCERYVIEW_WEB_URL=${trimTrailingSlash(input.webUrl)}` : undefined,
      `HTTP_SMOKE_TIMEOUT_SECONDS=${timeout}`,
      'infra/scripts/smoke-hosted-http.sh'
    ]
      .filter(Boolean)
      .join(' ')
  ];
  const evidence = ['hosted_api_health'];
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

export type DeploymentManifestService = {
  name?: unknown;
  type?: unknown;
  workspace?: unknown;
  startCommand?: unknown;
  buildCommand?: unknown;
  outputDirectory?: unknown;
  healthCheck?: unknown;
  requiredEnv?: unknown;
};

export type DeploymentManifest = {
  version?: unknown;
  services?: unknown;
};

export type DeploymentManifestValidationReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  warnings: string[];
  serviceNames: string[];
};

type HealthCheckShape = {
  path?: unknown;
  expectedStatus?: unknown;
};

export function validateDeploymentManifest(manifest: DeploymentManifest): DeploymentManifestValidationReport {
  const blockers: string[] = [];
  const warnings: string[] = [];
  const serviceNames: string[] = [];

  if (manifest.version !== 1) blockers.push('manifest_version_not_supported');
  if (!Array.isArray(manifest.services) || manifest.services.length === 0) {
    blockers.push('services_missing');
    return { status: 'blocked', blockers, warnings, serviceNames };
  }

  const seenNames = new Set<string>();
  for (const [index, rawService] of manifest.services.entries()) {
    const service = rawService as DeploymentManifestService;
    const name = typeof service.name === 'string' && service.name.trim().length > 0 ? service.name : `service_${index}`;
    if (name === `service_${index}`) blockers.push(`service_name_missing:${index}`);
    if (seenNames.has(name)) blockers.push(`duplicate_service:${name}`);
    seenNames.add(name);
    serviceNames.push(name);

    if (typeof service.workspace !== 'string' || !service.workspace.startsWith('@groceryview/')) {
      blockers.push(`workspace_invalid:${name}`);
    }
    if (typeof service.type !== 'string' || service.type.trim().length === 0) blockers.push(`service_type_missing:${name}`);

    const healthCheck = service.healthCheck as HealthCheckShape | undefined;
    if (!healthCheck || typeof healthCheck.path !== 'string' || !healthCheck.path.startsWith('/')) {
      blockers.push(`health_check_path_invalid:${name}`);
    }
    if (!healthCheck || typeof healthCheck.expectedStatus !== 'number' || healthCheck.expectedStatus < 200 || healthCheck.expectedStatus > 399) {
      blockers.push(`health_check_status_invalid:${name}`);
    }

    if (!Array.isArray(service.requiredEnv) || !service.requiredEnv.every((envVar) => typeof envVar === 'string' && /^[A-Z][A-Z0-9_]*$/.test(envVar))) {
      blockers.push(`required_env_invalid:${name}`);
    }

    if (service.type === 'node-http' && (typeof service.startCommand !== 'string' || service.startCommand.trim().length === 0)) {
      blockers.push(`start_command_missing:${name}`);
    }
    if (service.type === 'static-site') {
      if (typeof service.buildCommand !== 'string' || service.buildCommand.trim().length === 0) blockers.push(`build_command_missing:${name}`);
      if (typeof service.outputDirectory !== 'string' || service.outputDirectory.trim().length === 0) blockers.push(`output_directory_missing:${name}`);
    }
    if (Array.isArray(service.requiredEnv) && service.requiredEnv.length === 0) warnings.push(`no_required_env:${name}`);
  }

  return {
    status: blockers.length === 0 ? 'ready' : 'blocked',
    blockers,
    warnings,
    serviceNames
  };
}
