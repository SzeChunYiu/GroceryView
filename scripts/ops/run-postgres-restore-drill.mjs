#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const DEFAULT_BACKUP_DIR = 'backups/postgres';
const DEFAULT_KEY_TABLES = ['chains', 'stores', 'products', 'observations', 'latest_prices', 'source_runs'];
const BACKUP_EXTENSIONS = ['.backup', '.dump', '.sql', '.tar'];
const BACKUP_GZIP_SUFFIXES = ['.sql.gz', '.dump.gz', '.backup.gz'];

function redact(value) {
  return String(value ?? '')
    .replace(/postgres(?:ql)?:\/\/[^\s'"]+/gi, '[redacted_database_url]')
    .replace(/password=[^\s]+/gi, 'password=[redacted]');
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, '""')}"`;
}

function quoteLiteral(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function parseList(value, fallback) {
  const entries = String(value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : fallback;
}

function backupExtension(path) {
  const lower = path.toLowerCase();
  const gzipSuffix = BACKUP_GZIP_SUFFIXES.find((suffix) => lower.endsWith(suffix));
  if (gzipSuffix) return gzipSuffix;
  return extname(lower);
}

function backupCandidatesFromDir(dir) {
  const entries = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      entries.push(...backupCandidatesFromDir(fullPath));
      continue;
    }
    const extension = backupExtension(fullPath);
    if (BACKUP_EXTENSIONS.includes(extension) || BACKUP_GZIP_SUFFIXES.includes(extension)) {
      const stats = statSync(fullPath);
      entries.push({ path: fullPath, mtimeMs: stats.mtimeMs, sizeBytes: stats.size });
    }
  }
  return entries;
}

export function findLatestBackup(env = process.env) {
  if (env.GROCERYVIEW_BACKUP_FILE?.trim()) {
    const path = resolve(env.GROCERYVIEW_BACKUP_FILE.trim());
    const stats = statSync(path);
    return { path, mtimeMs: stats.mtimeMs, sizeBytes: stats.size };
  }

  const backupDir = resolve(env.GROCERYVIEW_BACKUP_DIR?.trim() || env.POSTGRES_BACKUP_DIR?.trim() || DEFAULT_BACKUP_DIR);
  const candidates = backupCandidatesFromDir(backupDir).sort((left, right) => right.mtimeMs - left.mtimeMs);
  if (!candidates[0]) throw new Error(`No Postgres backup files found in ${backupDir}.`);
  return candidates[0];
}

function databaseUrlWithName(rawUrl, databaseName) {
  const url = new URL(rawUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function disposableDatabaseName(env = process.env, now = new Date()) {
  const prefix = env.GROCERYVIEW_RESTORE_DRILL_DB_PREFIX?.trim() || 'groceryview_restore_drill';
  const stamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  return `${prefix}_${stamp}_${process.pid}`;
}

function commandText(command, args) {
  return [command, ...args.map((arg) => String(arg).includes('postgres://') || String(arg).includes('postgresql://') ? '[redacted_database_url]' : arg)].join(' ');
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const child = spawn(command, args, {
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => {
      reject(new Error(`${commandText(command, args)} failed to start: ${redact(error.message)}`));
    });
    child.on('close', (code) => {
      const durationMs = Date.now() - startedAt;
      if (code === 0) {
        resolve({ stdout, stderr, durationMs });
        return;
      }
      reject(new Error(`${commandText(command, args)} exited ${code}: ${redact(stderr || stdout)}`));
    });
  });
}

async function psql(databaseUrl, sql, output = 'json') {
  const args = [
    databaseUrl,
    '-v',
    'ON_ERROR_STOP=1',
    '-X',
    '-q',
    '-t',
    '-A',
    '-c',
    sql
  ];
  const result = await runCommand('psql', args);
  const text = result.stdout.trim();
  if (output === 'text') return text;
  return text ? JSON.parse(text) : null;
}

async function createDisposableDatabase(adminUrl, databaseName) {
  await psql(adminUrl, `create database ${quoteIdentifier(databaseName)}`, 'text');
}

async function dropDisposableDatabase(adminUrl, databaseName) {
  await psql(adminUrl, `select pg_terminate_backend(pid) from pg_stat_activity where datname = ${quoteLiteral(databaseName)} and pid <> pg_backend_pid()`, 'text');
  await psql(adminUrl, `drop database if exists ${quoteIdentifier(databaseName)}`, 'text');
}

async function restoreBackup(backupPath, targetUrl) {
  const extension = backupExtension(backupPath);
  if (extension === '.sql') {
    return runCommand('psql', [targetUrl, '-v', 'ON_ERROR_STOP=1', '-f', backupPath]);
  }
  if (extension === '.sql.gz') {
    return runCommand('sh', ['-c', 'gzip -dc "$1" | psql "$2" -v ON_ERROR_STOP=1 -f -', 'restore-sql-gz', backupPath, targetUrl]);
  }
  if (extension === '.dump.gz' || extension === '.backup.gz') {
    return runCommand('sh', ['-c', 'gzip -dc "$1" | pg_restore --clean --if-exists --no-owner --dbname "$2"', 'restore-dump-gz', backupPath, targetUrl]);
  }
  return runCommand('pg_restore', ['--clean', '--if-exists', '--no-owner', '--dbname', targetUrl, backupPath]);
}

async function verifySchemaVersion(targetUrl) {
  return psql(targetUrl, `
    select json_build_object(
      'migrationCount', count(*),
      'latestVersion', max(version),
      'versions', coalesce(json_agg(version order by version), '[]'::json)
    )
    from schema_migrations
  `);
}

async function verifyKeyTables(targetUrl, keyTables) {
  return psql(targetUrl, `
    with required(table_name) as (
      select unnest(array[${keyTables.map((table) => `'${table.replace(/'/g, "''")}'`).join(', ')}]::text[])
    )
    select json_build_object(
      'tables',
      json_agg(json_build_object(
        'tableName', required.table_name,
        'exists', tables.table_name is not null
      ) order by required.table_name)
    )
    from required
    left join information_schema.tables tables
      on tables.table_schema = 'public'
      and tables.table_name = required.table_name
  `);
}

async function verifyRowCounts(targetUrl, keyTables) {
  const counts = [];
  for (const table of keyTables) {
    const result = await psql(targetUrl, `select json_build_object('tableName', '${table.replace(/'/g, "''")}', 'rowCount', count(*)) from ${quoteIdentifier(table)}`);
    counts.push(result);
  }
  return counts;
}

async function runSampleQueries(targetUrl) {
  const queries = [
    {
      name: 'products_have_names',
      sql: "select json_build_object('matchingRows', count(*)) from products where canonical_name is not null"
    },
    {
      name: 'latest_prices_join_products',
      sql: "select json_build_object('matchingRows', count(*)) from latest_prices join products on products.id = latest_prices.product_id"
    },
    {
      name: 'chains_join_stores',
      sql: "select json_build_object('matchingRows', count(*)) from chains left join stores on stores.chain_id = chains.id"
    }
  ];
  const results = [];
  for (const query of queries) {
    const result = await psql(targetUrl, query.sql);
    results.push({ name: query.name, ...result });
  }
  return results;
}

export async function runPostgresRestoreDrill(env = process.env, options = {}) {
  const backup = findLatestBackup(env);
  const keyTables = parseList(env.GROCERYVIEW_RESTORE_DRILL_KEY_TABLES, DEFAULT_KEY_TABLES);
  const keepDatabase = env.GROCERYVIEW_RESTORE_DRILL_KEEP_DB === '1';
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  const adminUrl = env.GROCERYVIEW_RESTORE_DRILL_ADMIN_URL?.trim() || env.RESTORE_DRILL_DATABASE_URL?.trim();
  const providedTargetUrl = env.GROCERYVIEW_RESTORE_DRILL_TARGET_URL?.trim();
  const databasePrefix = env.GROCERYVIEW_RESTORE_DRILL_DB_PREFIX?.trim() || 'groceryview_restore_drill';
  const databaseName = providedTargetUrl ? new URL(providedTargetUrl).pathname.replace(/^\//, '') : disposableDatabaseName(env);
  const targetUrl = providedTargetUrl || (adminUrl ? databaseUrlWithName(adminUrl, databaseName) : '');
  if (!targetUrl) throw new Error('GROCERYVIEW_RESTORE_DRILL_ADMIN_URL or GROCERYVIEW_RESTORE_DRILL_TARGET_URL is required.');
  if (providedTargetUrl && env.GROCERYVIEW_RESTORE_DRILL_ALLOW_EXISTING_TARGET !== '1' && !databaseName.startsWith(databasePrefix)) {
    throw new Error(`GROCERYVIEW_RESTORE_DRILL_TARGET_URL must point at a disposable database prefixed with ${databasePrefix}.`);
  }

  const failures = [];
  const restoreStartedAt = Date.now();
  let createdDatabase = false;

  try {
    if (!providedTargetUrl) {
      await createDisposableDatabase(adminUrl, databaseName);
      createdDatabase = true;
    }
    const restore = await restoreBackup(backup.path, targetUrl);
    const schemaVersion = await verifySchemaVersion(targetUrl);
    const keyTableEvidence = await verifyKeyTables(targetUrl, keyTables);
    const missingTables = (keyTableEvidence?.tables ?? []).filter((table) => !table.exists).map((table) => table.tableName);
    if (missingTables.length > 0) failures.push(`Missing key tables: ${missingTables.join(', ')}`);
    const rowCounts = missingTables.length === 0 ? await verifyRowCounts(targetUrl, keyTables) : [];
    const sampleQueries = missingTables.length === 0 ? await runSampleQueries(targetUrl) : [];
    const restoreCompletedAt = Date.now();

    return {
      status: failures.length === 0 ? 'ready' : 'failed',
      generatedAt,
      backup: {
        path: backup.path,
        fileName: basename(backup.path),
        sizeBytes: backup.sizeBytes,
        modifiedAt: new Date(backup.mtimeMs).toISOString()
      },
      disposableDatabase: {
        databaseName,
        createdByDrill: createdDatabase,
        kept: keepDatabase
      },
      restore: {
        durationMs: restoreCompletedAt - restoreStartedAt,
        restoreCommandDurationMs: restore.durationMs,
        rtoSeconds: Number(((restoreCompletedAt - restoreStartedAt) / 1000).toFixed(3))
      },
      checks: {
        schemaVersion,
        keyTables: keyTableEvidence?.tables ?? [],
        rowCounts,
        sampleQueries
      },
      failures
    };
  } catch (error) {
    return {
      status: 'failed',
      generatedAt,
      backup: {
        path: backup.path,
        fileName: basename(backup.path),
        sizeBytes: backup.sizeBytes,
        modifiedAt: new Date(backup.mtimeMs).toISOString()
      },
      disposableDatabase: {
        databaseName,
        createdByDrill: createdDatabase,
        kept: keepDatabase
      },
      restore: {
        durationMs: Date.now() - restoreStartedAt,
        rtoSeconds: Number(((Date.now() - restoreStartedAt) / 1000).toFixed(3))
      },
      checks: {},
      failures: [redact(error instanceof Error ? error.message : String(error))]
    };
  } finally {
    if (createdDatabase && !keepDatabase) {
      await dropDisposableDatabase(adminUrl, databaseName).catch((error) => {
        process.stderr.write(`restore drill cleanup failed: ${redact(error instanceof Error ? error.message : String(error))}\n`);
      });
    }
  }
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  const report = await runPostgresRestoreDrill(process.env).catch((error) => ({
    status: 'failed',
    generatedAt: new Date().toISOString(),
    checks: {},
    failures: [redact(error instanceof Error ? error.message : String(error))]
  }));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (report.status !== 'ready') process.exitCode = 1;
}
