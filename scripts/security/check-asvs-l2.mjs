#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(new URL('../..', import.meta.url).pathname);
const checklistPath = resolve(repoRoot, 'docs/security/asvs-l2-groceryview.json');
const allowedStatuses = new Set(['mapped', 'unknown', 'not-applicable']);

function readChecklist() {
  return JSON.parse(readFileSync(checklistPath, 'utf8'));
}

function splitChangedFiles(value) {
  return value
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function gitChangedFiles() {
  const base = process.env.ASVS_BASE_REF || 'origin/main';
  const diff = spawnSync('git', ['diff', '--name-only', `${base}...HEAD`], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (diff.status === 0 && diff.stdout.trim()) return splitChangedFiles(diff.stdout);

  const fallback = spawnSync('git', ['diff', '--name-only', 'HEAD~1...HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8'
  });
  if (fallback.status === 0) return splitChangedFiles(fallback.stdout);
  return [];
}

function changedFilesFromArgs() {
  const changedFilesArg = process.argv.indexOf('--changed-files');
  if (changedFilesArg >= 0) {
    const value = process.argv[changedFilesArg + 1] || '';
    if (value === '-') return splitChangedFiles(readFileSync(0, 'utf8'));
    return splitChangedFiles(value);
  }
  if (process.env.ASVS_CHANGED_FILES) return splitChangedFiles(process.env.ASVS_CHANGED_FILES);
  return gitChangedFiles();
}

function compilePattern(pattern) {
  return new RegExp(pattern);
}

function matchingAreas(checklist, changedFiles) {
  return checklist.changedAreaPolicy
    .map((area) => ({
      ...area,
      changedFiles: changedFiles.filter((file) => area.pathPatterns.some((pattern) => compilePattern(pattern).test(file)))
    }))
    .filter((area) => area.changedFiles.length > 0);
}

function validateChecklistShape(checklist) {
  const failures = [];
  if (checklist.standard?.version !== '5.0.0') failures.push('Checklist must pin OWASP ASVS version 5.0.0.');
  for (const flow of ['web', 'api', 'auth', 'data']) {
    if (!checklist.scope?.flows?.some((entry) => entry.id === flow)) failures.push(`Checklist scope is missing ${flow} flow.`);
  }

  const seenControls = new Set();
  for (const control of checklist.controls || []) {
    if (!control.id) failures.push('A control is missing id.');
    if (seenControls.has(control.id)) failures.push(`Duplicate control id: ${control.id}`);
    seenControls.add(control.id);
    if (control.asvs?.level !== 'L2') failures.push(`${control.id} must be scoped to ASVS L2.`);
    if (!/^v5\.0\.0-V\d+\.\d+\.\d+$/.test(control.asvs?.reference || '')) failures.push(`${control.id} must use v5.0.0-Vx.y.z reference format.`);
    if (!allowedStatuses.has(control.status)) failures.push(`${control.id} has unsupported status: ${control.status}`);
    if (control.status === 'unknown' && control.blocker !== true) failures.push(`${control.id} is unknown but is not marked blocker.`);
    if (control.status === 'mapped' && (!Array.isArray(control.evidence) || control.evidence.length === 0)) failures.push(`${control.id} is mapped without evidence.`);
    for (const evidence of control.evidence || []) {
      if (evidence.path && !existsSync(resolve(repoRoot, evidence.path))) failures.push(`${control.id} evidence path does not exist: ${evidence.path}`);
    }
  }

  const controlIds = new Set((checklist.controls || []).map((control) => control.id));
  for (const area of checklist.changedAreaPolicy || []) {
    for (const requiredControlId of area.requiredControlIds || []) {
      if (!controlIds.has(requiredControlId)) failures.push(`${area.id} requires missing control ${requiredControlId}.`);
    }
  }
  return failures;
}

function evaluateChangedAreas(checklist, areas) {
  const controls = new Map(checklist.controls.map((control) => [control.id, control]));
  const failures = [];
  const evidence = [];

  for (const area of areas) {
    for (const requiredControlId of area.requiredControlIds) {
      const control = controls.get(requiredControlId);
      if (!control) {
        failures.push(`${area.id}: missing required control ${requiredControlId}.`);
        continue;
      }
      if (control.status !== 'mapped') {
        failures.push(`${area.id}: ${requiredControlId} is ${control.status}; blocker=${control.blocker === true}; ${control.blockerReason || 'no blocker reason'}`);
        continue;
      }
      evidence.push({
        area: area.id,
        control: requiredControlId,
        asvs: control.asvs.reference,
        evidence: control.evidence.map((entry) => entry.path || entry.summary)
      });
    }
  }
  return { failures, evidence };
}

function main() {
  const checklist = readChecklist();
  const changedFiles = changedFilesFromArgs();
  const shapeFailures = validateChecklistShape(checklist);
  const areas = matchingAreas(checklist, changedFiles);
  const { failures: areaFailures, evidence } = evaluateChangedAreas(checklist, areas);
  const failures = [...shapeFailures, ...areaFailures];
  const report = {
    standard: checklist.standard,
    changedFiles,
    changedAreas: areas.map((area) => ({
      id: area.id,
      changedFiles: area.changedFiles,
      requiredControlIds: area.requiredControlIds
    })),
    evidence,
    failures
  };

  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`ASVS ${checklist.standard.version} L2 gate: ${areas.length} sensitive area(s), ${evidence.length} mapped evidence item(s), ${failures.length} failure(s).`);
    for (const area of report.changedAreas) {
      console.log(`- ${area.id}: ${area.changedFiles.join(', ')}`);
    }
    for (const failure of failures) {
      console.error(`ASVS-L2 failure: ${failure}`);
    }
  }

  if (failures.length > 0) process.exit(1);
}

main();
