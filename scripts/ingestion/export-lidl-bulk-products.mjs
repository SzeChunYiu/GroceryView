#!/usr/bin/env node
import process from 'node:process';
import { fetchLidlBulkProducts } from '@groceryview/ingestion';

const maxRowsArg = process.argv.find((arg) => arg.startsWith('--max-rows='));
const maxRows = maxRowsArg ? Number(maxRowsArg.split('=')[1]) : undefined;

try {
  const products = await fetchLidlBulkProducts({ maxRows });
  process.stdout.write(`${JSON.stringify({ retrievedAt: new Date().toISOString(), count: products.length, products }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`[lidl-bulk-export] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
}
