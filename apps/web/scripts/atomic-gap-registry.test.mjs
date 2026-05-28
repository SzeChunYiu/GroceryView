import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registryPath = new URL('../../../docs/roadmap/atomic-gap-registry.md', import.meta.url);

const REQUIRED_FIELD_KEYWORDS = [
  'area',
  'severity',
  'pageOrFeature',
  'description',
  'userImpact',
  'fix',
  'testRequired',
  'status',
];

const GAP_ID_PATTERN = /^### `([a-z0-9-]+)`$/gm;

describe('atomic gap registry living spec', () => {
  it('exists at docs/roadmap/atomic-gap-registry.md', async () => {
    const source = await readFile(registryPath, 'utf8');
    assert.ok(source.length > 0, 'registry should not be empty');
    assert.match(source, /# Atomic gap registry/);
  });

  it('defines gap IDs and required fields for each open gap', async () => {
    const source = await readFile(registryPath, 'utf8');
    const ids = [...source.matchAll(GAP_ID_PATTERN)].map((match) => match[1]);
    assert.ok(ids.length >= 8, `expected at least 8 gap IDs, found ${ids.length}`);
    assert.equal(new Set(ids).size, ids.length, 'gap IDs must be unique');

    for (const id of ids) {
      const sectionStart = source.indexOf(`### \`${id}\``);
      assert.ok(sectionStart >= 0, `section for ${id} should exist`);
      const nextHeading = source.indexOf('\n### ', sectionStart + 1);
      const section = nextHeading === -1 ? source.slice(sectionStart) : source.slice(sectionStart, nextHeading);

      for (const field of REQUIRED_FIELD_KEYWORDS) {
        assert.match(
          section,
          new RegExp(`\\| ${field} \\|`),
          `${id} should document ${field}`,
        );
      }

      assert.match(section, /\| status \| open \|/, `${id} should be tracked as open in registry`);
    }
  });

  it('mentions required tests section and summary counts', async () => {
    const source = await readFile(registryPath, 'utf8');
    assert.match(source, /Required tests/i);
    assert.match(source, /Total gaps:/);
    assert.match(source, /atomic-gap-registry\.test\.mjs/);
  });
});
