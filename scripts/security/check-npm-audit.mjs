#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

function argValue(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function readWaivers(path) {
  const raw = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(raw.waivers)) throw new Error(`${path} must contain a waivers array.`);
  return raw.waivers;
}

function activeWaiverFor(vulnerability, waivers, now) {
  return waivers.find((waiver) => {
    if (waiver.package !== vulnerability.package) return false;
    if (!waiver.expiresAt || Number.isNaN(Date.parse(waiver.expiresAt))) return false;
    if (Date.parse(waiver.expiresAt) <= now.getTime()) return false;
    return !waiver.via || vulnerability.via.includes(waiver.via);
  });
}

function normalizeVulnerability([packageName, vulnerability]) {
  const via = Array.isArray(vulnerability.via)
    ? vulnerability.via.map((entry) => typeof entry === 'string' ? entry : entry.title ?? entry.source ?? '').filter(Boolean)
    : [];
  return {
    package: packageName,
    severity: vulnerability.severity,
    via,
    range: vulnerability.range,
    fixAvailable: Boolean(vulnerability.fixAvailable)
  };
}

const waiverPath = argValue('--waivers', '.github/security/npm-audit-waivers.json');
const summaryPath = argValue('--summary', 'security-npm-audit-summary.json');
const waivers = readWaivers(waiverPath);
const audit = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8' });
const auditJson = audit.stdout.trim() ? JSON.parse(audit.stdout) : { vulnerabilities: {} };
const highOrCritical = Object.entries(auditJson.vulnerabilities ?? {})
  .map(normalizeVulnerability)
  .filter((vulnerability) => vulnerability.severity === 'high' || vulnerability.severity === 'critical');
const now = new Date();
const waived = [];
const unwaived = [];

for (const vulnerability of highOrCritical) {
  const waiver = activeWaiverFor(vulnerability, waivers, now);
  if (waiver) {
    waived.push({ ...vulnerability, waiver: { reason: waiver.reason, expiresAt: waiver.expiresAt } });
  } else {
    unwaived.push(vulnerability);
  }
}

const summary = {
  generatedAt: now.toISOString(),
  highOrCriticalCount: highOrCritical.length,
  waivedCount: waived.length,
  unwaivedCount: unwaived.length,
  waived,
  unwaived
};

writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (unwaived.length > 0) {
  process.stderr.write(`Unwaived high/critical npm audit findings: ${unwaived.map((vulnerability) => vulnerability.package).join(', ')}\n`);
  process.exit(1);
}
