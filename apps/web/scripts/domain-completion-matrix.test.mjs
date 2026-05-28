import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const repo = new URL('../../..', import.meta.url);
const readRepo = (relative) => readFile(new URL(relative, repo), 'utf8');
const existsRepo = (relative) => existsSync(new URL(relative, repo));

const expectedDomainRequirements = [
  'landingPage',
  'searchDomain',
  'detailPage',
  'mapLayer',
  'mapSelectedDetail',
  'watchlistAlerts',
  'evidenceConfidence',
  'claimBoundaryTests',
  'adminBackstageReports',
  'analyticsEvents',
  'releaseReady'
];

test('domain completion matrix closes every domain cell as yes + tested', async () => {
  const [matrixSource, docs] = await Promise.all([
    readRepo('docs/release/domain-closure-matrix.json'),
    readRepo('docs/release/domain-completion-matrix.md')
  ]);
  const matrix = JSON.parse(matrixSource);

  for (const domainName of ['grocery', 'fuel', 'pharmacyOtc']) {
    const domain = matrix.domains[domainName];
    assert.equal(domain.status, 'yes + tested', `${domainName} status`);
    assert.deepEqual(domain.blockingItems, [], `${domainName} blockers`);
    for (const requirement of expectedDomainRequirements) {
      assert.equal(domain.requirements[requirement], 'yes + tested', `${domainName}.${requirement}`);
    }
    for (const evidencePath of domain.evidence) {
      assert.ok(existsRepo(evidencePath), `${domainName} evidence exists: ${evidencePath}`);
    }
  }

  assert.equal(matrix.platform.status, 'yes + tested');
  assert.deepEqual(matrix.platform.blockingItems, []);
  for (const value of Object.values(matrix.platform.requirements)) {
    assert.equal(value, 'yes + tested');
  }
  for (const evidencePath of matrix.platform.evidence) {
    assert.ok(existsRepo(evidencePath), `platform evidence exists: ${evidencePath}`);
  }

  assert.match(docs, /There are no open release blockers/);
  assert.doesNotMatch(docs, /partial|not yet|scaffold|missing/i);
});
