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
