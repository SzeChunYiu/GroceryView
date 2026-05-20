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

export type TrafficRampStageInput = {
  trafficPercent: number;
  holdMinutes: number;
  requiredChecks: string[];
};

export type TrafficRampPlanInput = {
  release: string;
  previousRelease: string;
  readiness: DeploymentReadinessReport;
  stages: TrafficRampStageInput[];
  databaseMigration?: string;
  reversibleMigration: boolean;
};

export type TrafficRampStage = {
  trafficPercent: number;
  holdMinutes: number;
  actions: string[];
  rollbackTrigger: string;
};

export type TrafficRampPlan = {
  status: 'ready' | 'blocked';
  release: string;
  blockers: string[];
  stages: TrafficRampStage[];
  rollback: RollbackPlan;
  summary: string;
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

function requireReleaseId(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label} is required.`);
}

function requireRampStages(stages: TrafficRampStageInput[]): void {
  if (stages.length === 0) throw new Error('At least one traffic ramp stage is required.');

  let previousPercent = 0;
  for (const stage of stages) {
    if (!Number.isInteger(stage.trafficPercent) || stage.trafficPercent <= 0 || stage.trafficPercent > 100) {
      throw new Error('trafficPercent must be an integer between 1 and 100.');
    }
    if (stage.trafficPercent <= previousPercent) throw new Error('trafficPercent values must strictly increase.');
    if (!Number.isInteger(stage.holdMinutes) || stage.holdMinutes < 0) throw new Error('holdMinutes must be a non-negative integer.');
    if (stage.requiredChecks.length === 0 || stage.requiredChecks.some((check) => !check.trim())) {
      throw new Error('Each traffic ramp stage must define required checks.');
    }
    previousPercent = stage.trafficPercent;
  }

  if (stages[stages.length - 1]?.trafficPercent !== 100) throw new Error('Final traffic ramp stage must reach 100 percent.');
}

export function buildTrafficRampPlan(input: TrafficRampPlanInput): TrafficRampPlan {
  requireReleaseId(input.release, 'release');
  requireReleaseId(input.previousRelease, 'previousRelease');
  requireRampStages(input.stages);

  const rollback = buildRollbackPlan({
    currentRelease: input.release,
    previousRelease: input.previousRelease,
    databaseMigration: input.databaseMigration,
    reversibleMigration: input.reversibleMigration
  });

  if (input.readiness.status === 'blocked') {
    return {
      status: 'blocked',
      release: input.release,
      blockers: [...input.readiness.blockers],
      stages: [],
      rollback,
      summary: 'Traffic ramp is blocked until deployment readiness gates pass.'
    };
  }

  return {
    status: 'ready',
    release: input.release,
    blockers: [],
    stages: input.stages.map((stage) => ({
      trafficPercent: stage.trafficPercent,
      holdMinutes: stage.holdMinutes,
      actions: [
        `Shift ${stage.trafficPercent}% traffic to release ${input.release}.`,
        `Hold for ${stage.holdMinutes} minutes.`,
        `Verify ${stage.requiredChecks.join(', ')}.`
      ],
      rollbackTrigger: `Rollback to ${input.previousRelease} if ${stage.requiredChecks.join(', ')} fails during the ${stage.trafficPercent}% ramp.`
    })),
    rollback,
    summary: `Traffic ramp for ${input.release} is ready across ${input.stages.length} stages.`
  };
}
