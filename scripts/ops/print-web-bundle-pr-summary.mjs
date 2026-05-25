#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { join } from 'node:path';
import process from 'node:process';
import { buildWebBundleBudgetReport } from './print-catalog-coverage-targets.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const chartSource = readFileSync(join(root, 'apps/web/src/components/price-chart-terminal.tsx'), 'utf8');
const usesDynamicLightweightCharts = /import\('lightweight-charts'\)/.test(chartSource);
const hasStaticLightweightChartsImport = /import\s+\{[^}]*\}\s+from 'lightweight-charts'/.test(chartSource);
const budgetReport = buildWebBundleBudgetReport();
const summary = {
  status: budgetReport.status === 'pass' && usesDynamicLightweightCharts && !hasStaticLightweightChartsImport ? 'pass' : 'fail',
  generatedAt: new Date().toISOString(),
  coreWebVitalsBudget: {
    lcp: '2500ms',
    inp: '200ms',
    cls: '0.10'
  },
  routeBudgets: budgetReport.routes,
  clientComponentBudgets: budgetReport.clientComponents,
  lazyModules: [
    {
      module: 'lightweight-charts',
      status: usesDynamicLightweightCharts && !hasStaticLightweightChartsImport ? 'lazy-loaded' : 'blocking-import'
    }
  ],
  actions: [
    'Keep chart libraries behind dynamic import boundaries.',
    'Review oversized route and client component rows before merging web UI changes.',
    'Use the Lighthouse budget output for Core Web Vitals regressions.'
  ]
};

mkdirSync(join(root, 'docs/test-results'), { recursive: true });
writeFileSync(join(root, 'docs/test-results/web-bundle-pr-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
writeFileSync(join(root, 'docs/test-results/web-bundle-pr-summary.md'), `# Web Bundle PR Summary

- Status: ${summary.status}
- Core Web Vitals budget: LCP ${summary.coreWebVitalsBudget.lcp}, INP ${summary.coreWebVitalsBudget.inp}, CLS ${summary.coreWebVitalsBudget.cls}
- Lazy module: lightweight-charts is ${summary.lazyModules[0].status}
- Route budgets checked: ${summary.routeBudgets.map((route) => `${route.route} <= ${route.budgetKb}KB`).join(', ')}
- Client component budgets checked: ${summary.clientComponentBudgets.map((component) => `${component.component} <= ${component.budgetKb}KB`).join(', ')}

## Actions

${summary.actions.map((action) => `- ${action}`).join('\n')}
`);
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (summary.status !== 'pass') {
  process.stderr.write('Web bundle PR summary failed. Check lazy module boundaries and budget rows.\n');
  process.exit(1);
}
