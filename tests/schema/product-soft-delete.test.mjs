import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = new URL('../..', import.meta.url).pathname;
const prismaSchema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
const prismaMigrationsDir = join(repoRoot, 'prisma/migrations');
const prismaMigrations = existsSync(prismaMigrationsDir)
  ? readdirSync(prismaMigrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const migrationPath = join(prismaMigrationsDir, entry.name, 'migration.sql');
      return existsSync(migrationPath) ? [readFileSync(migrationPath, 'utf8')] : [];
    })
    .join('\n')
  : '';
const infraMigrations = readdirSync(join(repoRoot, 'infra/db/migrations'))
  .filter((file) => file.endsWith('.sql'))
  .map((file) => readFileSync(join(repoRoot, 'infra/db/migrations', file), 'utf8'))
  .join('\n');
const activePredicate = readFileSync(join(repoRoot, 'packages/db/src/queries/items.ts'), 'utf8');
const productSearch = readFileSync(join(repoRoot, 'packages/db/src/queries/productSearch.ts'), 'utf8');
const dbIndex = readFileSync(join(repoRoot, 'packages/db/src/index.ts'), 'utf8');

describe('product soft delete schema', () => {
  it('adds nullable product deletedAt metadata to Prisma and SQL migrations', () => {
    assert.match(prismaSchema, /\bdeletedAt\s+DateTime\?\s+@map\("deleted_at"\)\s+@db\.Timestamptz\(6\)/);
    assert.match(prismaSchema, /@@index\(\[deletedAt\]\)/);
    assert.match(prismaMigrations, /alter table products add column if not exists deleted_at timestamptz/i);
    assert.match(infraMigrations, /alter table products add column if not exists deleted_at timestamptz/i);
    assert.match(infraMigrations, /products_active_slug_idx on products\(slug\) where deleted_at is null/i);
  });

  it('shares an active-product predicate across public item queries', () => {
    assert.match(activePredicate, /products\.deleted_at is null/);
    assert.match(productSearch, /ACTIVE_PRODUCTS_PREDICATE/);
    assert.match(dbIndex, /ACTIVE_PRODUCTS_PREDICATE/);
    assert.match(dbIndex, /deleted_at = null/);
  });
});
