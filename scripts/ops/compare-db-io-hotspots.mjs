#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import process from 'node:process';

export const DB_IO_HOTSPOT_DELTA_COUNTERS = [
  'sharedBlksRead',
  'sharedBlksWritten',
  'localBlksRead',
  'localBlksWritten',
  'tempBlksRead',
  'tempBlksWritten',
  'blkReadTimeMs',
  'blkWriteTimeMs'
];

function numericCounter(row, counter) {
  return Number(row?.[counter] ?? 0);
}

export function compareDailyDatabaseIoHotspots(before, after, now = new Date()) {
  const beforeRows = new Map((before.hotspots ?? []).map((row) => [String(row.queryid), row]));
  const afterRows = new Map((after.hotspots ?? []).map((row) => [String(row.queryid), row]));
  const sharedQueryIds = [...beforeRows.keys()].filter((queryid) => afterRows.has(queryid)).sort();

  const rows = sharedQueryIds.map((queryid) => {
    const beforeRow = beforeRows.get(queryid);
    const afterRow = afterRows.get(queryid);
    const beforeCounters = Object.fromEntries(
      DB_IO_HOTSPOT_DELTA_COUNTERS.map((counter) => [counter, numericCounter(beforeRow, counter)])
    );
    const afterCounters = Object.fromEntries(
      DB_IO_HOTSPOT_DELTA_COUNTERS.map((counter) => [counter, numericCounter(afterRow, counter)])
    );

    return {
      queryid,
      querySnippet: afterRow.querySnippet ?? beforeRow.querySnippet,
      before: beforeCounters,
      after: afterCounters,
      delta: Object.fromEntries(
        DB_IO_HOTSPOT_DELTA_COUNTERS.map((counter) => [counter, afterCounters[counter] - beforeCounters[counter]])
      )
    };
  });

  return {
    status: 'compared',
    comparedAt: now.toISOString(),
    beforeStatus: before.status,
    afterStatus: after.status,
    beforeHotspotCount: before.hotspots?.length ?? 0,
    afterHotspotCount: after.hotspots?.length ?? 0,
    sharedQueryCount: rows.length,
    beforeOnlyQueryIds: [...beforeRows.keys()].filter((queryid) => !afterRows.has(queryid)).sort(),
    afterOnlyQueryIds: [...afterRows.keys()].filter((queryid) => !beforeRows.has(queryid)).sort(),
    counters: DB_IO_HOTSPOT_DELTA_COUNTERS,
    rows
  };
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const name = arg.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for --${name}`);
    args[name] = value;
    index += 1;
  }
  return args;
}

export function compareDailyDatabaseIoHotspotsFiles({ beforePath, afterPath, outPath }) {
  if (!beforePath || !afterPath || !outPath) {
    throw new Error('Usage: compare-db-io-hotspots --before <path> --after <path> --out <path>');
  }

  let body;
  if (!existsSync(beforePath) || !existsSync(afterPath)) {
    body = {
      status: 'skipped',
      blocker: 'daily_db_io_hotspots_delta_missing_before_or_after',
      beforePath,
      afterPath
    };
  } else {
    const before = JSON.parse(readFileSync(beforePath, 'utf8'));
    const after = JSON.parse(readFileSync(afterPath, 'utf8'));
    body = compareDailyDatabaseIoHotspots(before, after);
  }

  writeFileSync(outPath, `${JSON.stringify(body, null, 2)}\n`);
  return body;
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = compareDailyDatabaseIoHotspotsFiles({
      beforePath: args.before,
      afterPath: args.after,
      outPath: args.out
    });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
