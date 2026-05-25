import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

const standards = read('docs/PROJECT_STANDARDS.md');
const readme = read('README.md');
const contributing = read('CONTRIBUTING.md');
const pullRequestTemplate = read('.github/PULL_REQUEST_TEMPLATE.md');

describe('project standards contract', () => {
  it('defines the tested, documented, and optimized bar for every changed atom', () => {
    for (const atom of [
      'component',
      'function',
      'route',
      'API',
      'connector',
      'ranker',
      'promotion parser',
      'migration',
      'cron job',
      'button'
    ]) {
      assert.match(standards, new RegExp(atom, 'i'));
    }

    for (const section of ['## Tested', '## Documented', '## Optimized', '## Enforcement']) {
      assert.match(standards, new RegExp(section.replace('#', '\\#')));
    }

    assert.match(standards, /happy path and at least one edge case/);
    assert.match(standards, /Playwright or equivalent end-to-end/);
    assert.match(standards, /axe accessibility checks with zero violations/);
    assert.match(standards, /fixture-based integration coverage/);
    assert.match(standards, /JSDoc or module comment/);
    assert.match(standards, /docs\/api\//);
    assert.match(standards, /docs\/connectors\//);
    assert.match(standards, /docs\/algorithms\//);
    assert.match(standards, /docs\/performance\/budgets\.md/);
    assert.match(standards, /Cache-Control/);
    assert.match(standards, /ETag/);
    assert.match(standards, /Do not swallow exceptions silently/);
  });

  it('links project standards from contributor-facing docs and PR template', () => {
    for (const source of [readme, contributing, pullRequestTemplate]) {
      assert.match(source, /docs\/PROJECT_STANDARDS\.md/);
    }
  });

  it('requires PR authors to acknowledge tested, documented, and optimized evidence', () => {
    for (const label of ['Tested', 'Documented', 'Optimized']) {
      assert.match(pullRequestTemplate, new RegExp(`- \\[ \\] ${label}:`));
    }

    assert.match(pullRequestTemplate, /Tests:/);
    assert.match(pullRequestTemplate, /Docs:/);
    assert.match(pullRequestTemplate, /Performance or optimization:/);
  });
});
