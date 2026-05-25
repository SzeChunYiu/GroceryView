#!/usr/bin/env node
import process from 'node:process';
import { checkBonusIsConnectorHealth } from '@groceryview/ingestion';

function maxRowsFromArgs(args) {
  const inline = args.find((arg) => arg.startsWith('--maxRows='));
  const value = inline ? inline.slice('--maxRows='.length) : args[args.indexOf('--maxRows') + 1];
  if (value === undefined || value.startsWith('--')) return 5;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) throw new Error(`Invalid --maxRows value: ${value}`);
  return parsed;
}

try {
  const health = await checkBonusIsConnectorHealth({ maxRows: maxRowsFromArgs(process.argv.slice(2)) });
  process.stdout.write(`${JSON.stringify(health)}\n`);
  if (!health.ok) process.exitCode = 1;
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
