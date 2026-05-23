#!/usr/bin/env node
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';
import pg from 'pg';

import {
  applyMigrations,
  createMigrationPlan,
  createPgQueryExecutor,
  createPostgresMigrationExecutor
} from '../../packages/db/dist/index.js';

const { Pool } = pg;
const repoRoot = new URL('../..', import.meta.url);
const migrationsDir = new URL('../../infra/db/migrations/', import.meta.url);

function sanitizeError(error) {
  const text = error instanceof Error ? `${error.name}: ${error.message} ${error.code ?? ''}`.trim() : String(error);
  return text
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]');
}

export function loadInfraMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((entry) => entry.endsWith('.sql') && !entry.startsWith('._'))
    .sort()
    .map((entry) => {
      const path = join('infra/db/migrations', entry);
      return {
        path,
        sql: readFileSync(new URL(path, repoRoot), 'utf8')
      };
    });
}

function requireDatabaseUrl(env) {
  if (!env.DATABASE_URL?.trim()) throw new Error('DATABASE_URL is required.');
  return env.DATABASE_URL.trim();
}

export async function applyProductionMigrations(env = process.env) {
  const databaseUrl = requireDatabaseUrl(env);
  const migrations = createMigrationPlan(loadInfraMigrationFiles());
  if (env.GROCERYVIEW_DB_MIGRATION_DRY_RUN === '1') {
    return {
      status: 'planned',
      migrationCount: migrations.length,
      plannedVersions: migrations.map((migration) => migration.version)
    };
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    idleTimeoutMillis: 1_000,
    connectionTimeoutMillis: 15_000,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const executor = createPostgresMigrationExecutor(createPgQueryExecutor(pool));
    const appliedVersions = await applyMigrations(executor, migrations);
    return {
      status: 'ready',
      migrationCount: migrations.length,
      appliedVersions
    };
  } finally {
    await pool.end();
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const result = await applyProductionMigrations(process.env);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${sanitizeError(error)}\n`);
    process.exitCode = 1;
  }
}
