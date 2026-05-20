export type GateStatus = 'pass' | 'fail' | 'not_run';

export type DeploymentReadinessInput = {
  providerSelected: boolean;
  requiredSecretsPresent: string[];
  requiredSecrets: string[];
  dnsConfigured: boolean;
  healthChecks: Array<{ name: string; status: GateStatus }>;
  smokeTests: Array<{ name: string; status: GateStatus }>;
  scheduledJobs?: Array<{ name: string; scheduleConfigured: boolean; status: GateStatus }>;
  observabilityConfigured: boolean;
};

export type DeploymentReadinessReport = {
  status: 'ready' | 'blocked';
  blockers: string[];
  warnings: string[];
  summary: string;
};

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
