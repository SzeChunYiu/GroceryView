import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const rootPackage = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const script = readFileSync(new URL('../../scripts/ops/apply-db-migrations.mjs', import.meta.url), 'utf8');
const gitignore = readFileSync(new URL('../../.gitignore', import.meta.url), 'utf8');

describe('production DB migration apply script', () => {
  it('exposes a root operator command for bootstrapping a replacement writable database', () => {
    assert.equal(rootPackage.scripts['ops:apply-db-migrations'], 'npm run build -w @groceryview/db && node scripts/ops/apply-db-migrations.mjs');
  });

  it('applies the canonical infra migrations through the shared migrator and pg executor', () => {
    for (const expected of [
      'resolveDailyWriteDatabaseUrl',
      'buildPostgresPoolConfig',
      'infra/db/migrations',
      'createMigrationPlan',
      'createPostgresMigrationExecutor',
      'createPgQueryExecutor',
      'applyMigrations',
      'appliedVersions'
    ]) {
      assert.match(script, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
    assert.doesNotMatch(script, /['"`]\.\.\/\.\.\/db\/migrations/);
    assert.match(script, /ssl:\s*\{\s*rejectUnauthorized:\s*false\s*\}/);
  });

  it('keeps Supabase CLI link state out of commits while allowing migration files', () => {
    assert.match(gitignore, /^supabase\/\.temp\/$/m);
    assert.doesNotMatch(gitignore, /^supabase\/$/m);
  });
});
