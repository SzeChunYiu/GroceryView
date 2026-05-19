import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');

describe('.gitignore generated artifacts', () => {
  it('ignores workspace build and test output directories', () => {
    for (const pattern of ['apps/*/dist/', 'apps/*/dist-test/', 'packages/*/dist/', 'packages/*/dist-test/']) {
      assert.match(gitignore, new RegExp(pattern.replaceAll('*', '\\*').replaceAll('/', '\\/')));
    }
  });
});
