import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const repoRoot = new URL('../..', import.meta.url);
const repoRootPath = repoRoot.pathname;

function readJson(path) {
  return JSON.parse(readFileSync(join(repoRootPath, path), 'utf8'));
}

function collectTsconfigs(directory = repoRootPath) {
  const entries = readdirSync(directory).flatMap((entry) => {
    if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || entry === 'dist-test') {
      return [];
    }

    const fullPath = join(directory, entry);
    if (statSync(fullPath).isDirectory()) {
      return collectTsconfigs(fullPath);
    }

    return /^tsconfig(?:\\..+)?\\.json$/.test(entry)
      ? [relative(repoRootPath, fullPath)]
      : [];
  });

  return entries.sort();
}

describe('TypeScript strict-mode configuration', () => {
  it('enables strict mode explicitly for every primary workspace tsconfig', () => {
    const primaryConfigs = collectTsconfigs().filter((configPath) => configPath.endsWith('tsconfig.json'));

    for (const configPath of primaryConfigs) {
      const config = readJson(configPath);
      assert.equal(
        config.compilerOptions?.strict,
        true,
        `${configPath} must set compilerOptions.strict to true`
      );
    }
  });

  it('keeps build and test tsconfigs from disabling inherited strict checks', () => {
    const secondaryConfigs = collectTsconfigs().filter((configPath) => !configPath.endsWith('tsconfig.json'));

    for (const configPath of secondaryConfigs) {
      const config = readJson(configPath);
      assert.notEqual(
        config.compilerOptions?.strict,
        false,
        `${configPath} must not disable inherited strict mode`
      );
    }
  });
});
