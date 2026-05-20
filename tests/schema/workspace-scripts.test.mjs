import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const readPackage = (path) => JSON.parse(readFileSync(new URL(`../../${path}/package.json`, import.meta.url), 'utf8'));

const packages = {
  api: readPackage('packages/api'),
  server: readPackage('packages/server'),
  mobile: readPackage('apps/mobile')
};

describe('workspace package scripts', () => {
  it('builds local workspace dependencies before tests that import package entrypoints', () => {
    for (const workspace of ['@groceryview/core', '@groceryview/monetization']) {
      assert.match(packages.api.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }

    for (const workspace of ['@groceryview/core', '@groceryview/monetization', '@groceryview/api', '@groceryview/auth', '@groceryview/scanning']) {
      assert.match(packages.server.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }

    for (const workspace of ['@groceryview/core', '@groceryview/monetization', '@groceryview/api']) {
      assert.match(packages.mobile.scripts.test, new RegExp(`npm run build -w ${workspace.replace('/', '\\/')}`));
    }
  });
});
