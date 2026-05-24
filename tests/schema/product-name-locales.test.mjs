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

describe('localized product names', () => {
  it('maps Swedish and English product name columns in Prisma', () => {
    assert.match(prismaSchema, /model Product\b/);
    assert.match(prismaSchema, /\bnameSv\s+String\?\s+@map\("name_sv"\)/);
    assert.match(prismaSchema, /\bnameEn\s+String\?\s+@map\("name_en"\)/);
    assert.match(prismaSchema, /@@map\("products"\)/);
  });

  it('ships a Prisma migration for nullable product locale name columns', () => {
    assert.match(prismaMigrations, /alter table products\s+add column if not exists name_sv text/i);
    assert.match(prismaMigrations, /alter table products\s+add column if not exists name_en text/i);
  });
});
