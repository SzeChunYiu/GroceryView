#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import process from 'node:process';

export const HOT_ENDPOINT_QUERY_PLAN_BUDGETS = {
  homepage: { maxSequentialScans: 0, maxPlanRows: 5_000, maxTempBlocks: 0, maxDurationMs: 80 },
  product: { maxSequentialScans: 1, maxPlanRows: 10_000, maxTempBlocks: 0, maxDurationMs: 120 },
  compare: { maxSequentialScans: 1, maxPlanRows: 12_000, maxTempBlocks: 0, maxDurationMs: 150 },
  screener: { maxSequentialScans: 1, maxPlanRows: 20_000, maxTempBlocks: 0, maxDurationMs: 180 },
  map: { maxSequentialScans: 1, maxPlanRows: 25_000, maxTempBlocks: 0, maxDurationMs: 180 },
  'chain-index': { maxSequentialScans: 1, maxPlanRows: 15_000, maxTempBlocks: 0, maxDurationMs: 150 },
  watchlist: { maxSequentialScans: 0, maxPlanRows: 5_000, maxTempBlocks: 0, maxDurationMs: 100 },
  'public-api': { maxSequentialScans: 1, maxPlanRows: 10_000, maxTempBlocks: 0, maxDurationMs: 120 }
};

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    args[arg.slice(2)] = value;
    index += 1;
  }
  return args;
}

function rootPlan(value) {
  if (Array.isArray(value)) return rootPlan(value[0]);
  if (value?.Plan) return value.Plan;
  return value;
}

function walkPlan(plan, visit) {
  if (!plan || typeof plan !== 'object') return;
  visit(plan);
  for (const child of plan.Plans ?? []) walkPlan(child, visit);
}

export function summarizeExplainPlan(explainJson) {
  const plan = rootPlan(explainJson);
  const summary = {
    durationMs: Number(explainJson?.['Execution Time'] ?? explainJson?.executionTimeMs ?? 0),
    maxPlanRows: 0,
    sequentialScans: 0,
    tempBlocks: 0
  };

  walkPlan(plan, (node) => {
    if (node['Node Type'] === 'Seq Scan') summary.sequentialScans += 1;
    summary.maxPlanRows = Math.max(summary.maxPlanRows, Number(node['Plan Rows'] ?? 0));
    summary.tempBlocks += Number(node['Temp Read Blocks'] ?? 0) + Number(node['Temp Written Blocks'] ?? 0);
  });

  return summary;
}

export function checkHotEndpointQueryPlans(fixtures, budgets = HOT_ENDPOINT_QUERY_PLAN_BUDGETS) {
  const rows = Object.entries(budgets).map(([endpoint, budget]) => {
    const plan = fixtures[endpoint];
    if (!plan) return { endpoint, status: 'failed', reason: 'missing_explain_fixture', budget };
    const summary = summarizeExplainPlan(plan);
    const violations = [
      summary.sequentialScans > budget.maxSequentialScans ? `sequential_scans:${summary.sequentialScans}>${budget.maxSequentialScans}` : null,
      summary.maxPlanRows > budget.maxPlanRows ? `plan_rows:${summary.maxPlanRows}>${budget.maxPlanRows}` : null,
      summary.tempBlocks > budget.maxTempBlocks ? `temp_blocks:${summary.tempBlocks}>${budget.maxTempBlocks}` : null,
      summary.durationMs > budget.maxDurationMs ? `duration_ms:${summary.durationMs}>${budget.maxDurationMs}` : null
    ].filter(Boolean);

    return {
      endpoint,
      status: violations.length > 0 ? 'failed' : 'passed',
      budget,
      summary,
      violations
    };
  });
  const failed = rows.filter((row) => row.status === 'failed');

  return {
    status: failed.length > 0 ? 'failed' : 'passed',
    checkedAt: new Date().toISOString(),
    approvalRequired: failed.length > 0,
    rows
  };
}

export function checkHotEndpointQueryPlanFixtureFile(path) {
  if (!path) throw new Error('Usage: check-hot-query-plans --fixtures <path>');
  const fixtures = JSON.parse(readFileSync(path, 'utf8'));
  return checkHotEndpointQueryPlans(fixtures);
}

if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = checkHotEndpointQueryPlanFixtureFile(args.fixtures);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    if (result.status === 'failed' && process.env.GROCERYVIEW_APPROVE_QUERY_PLAN_REGRESSION !== '1') {
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
