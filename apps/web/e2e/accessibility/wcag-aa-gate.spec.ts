import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import axeCore from 'axe-core';
import { expect, test, type Page, type TestInfo } from '@playwright/test';

type AxeViolationNode = {
  target: string[];
  html: string;
  failureSummary?: string;
};

type AxeViolation = {
  id: string;
  impact?: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: AxeViolationNode[];
  tags: string[];
};

type AxeResult = {
  violations: AxeViolation[];
};

type A11yException = {
  route: string;
  ruleId: string;
  target: string;
  issue: string;
  expiresOn: string;
  reason: string;
};

const coreRoutes = [
  { route: '/', label: 'homepage' },
  { route: '/compare', label: 'compare prices' },
  { route: '/list', label: 'shopping list' },
  { route: '/scanner', label: 'scanner' },
  { route: '/stores', label: 'stores' },
  { route: '/pricing', label: 'pricing' }
];

const severeImpacts = new Set(['serious', 'critical']);
const exceptionRegistry = JSON.parse(
  readFileSync(new URL('./wcag-aa-exceptions.json', import.meta.url), 'utf8')
) as A11yException[];

function assertExceptionRegistryIsActionable() {
  const today = new Date().toISOString().slice(0, 10);

  for (const exception of exceptionRegistry) {
    expect(exception.issue, `${exception.route} ${exception.ruleId} exception must link an issue`).toMatch(
      /^https:\/\/github\.com\/SzeChunYiu\/GroceryView\/issues\/\d+$/
    );
    expect(exception.expiresOn, `${exception.route} ${exception.ruleId} exception must use YYYY-MM-DD expiry`).toMatch(
      /^\d{4}-\d{2}-\d{2}$/
    );
    expect(exception.expiresOn >= today, `${exception.route} ${exception.ruleId} exception expired on ${exception.expiresOn}`).toBe(true);
    expect(exception.reason.trim().length, `${exception.route} ${exception.ruleId} exception needs a reason`).toBeGreaterThan(0);
  }
}

function nodeTarget(node: AxeViolationNode) {
  return node.target.join(' ');
}

function hasActiveException(route: string, violation: AxeViolation, node: AxeViolationNode) {
  const target = nodeTarget(node);

  return exceptionRegistry.some((exception) =>
    exception.route === route &&
    exception.ruleId === violation.id &&
    exception.target === target
  );
}

async function runAxe(page: Page) {
  await page.addScriptTag({ content: axeCore.source });
  return page.evaluate(async () => {
    const axe = (window as typeof window & { axe: typeof axeCore }).axe;
    return axe.run(document, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
      },
      resultTypes: ['violations']
    });
  }) as Promise<AxeResult>;
}

async function writeReport(testInfo: TestInfo, report: unknown) {
  const outputPath = path.join(testInfo.project.outputDir, 'a11y', 'wcag-aa-gate-report.json');
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  await testInfo.attach('wcag-aa-gate-report', {
    path: outputPath,
    contentType: 'application/json'
  });
}

test.describe('WCAG 2.2 AA release gate', () => {
  test('fails on unexcepted serious or critical axe findings across core pages', async ({ page }, testInfo) => {
    assertExceptionRegistryIsActionable();

    const routeReports = [];
    const blockers = [];

    for (const { route, label } of coreRoutes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const axeResult = await runAxe(page);
      const severeViolations = axeResult.violations
        .filter((violation) => severeImpacts.has(violation.impact ?? ''))
        .map((violation) => ({
          ...violation,
          nodes: violation.nodes.filter((node) => !hasActiveException(route, violation, node))
        }))
        .filter((violation) => violation.nodes.length > 0);

      routeReports.push({
        route,
        label,
        checkedAt: new Date().toISOString(),
        violationCount: axeResult.violations.length,
        severeViolationCount: severeViolations.length,
        severeViolations: severeViolations.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          helpUrl: violation.helpUrl,
          nodes: violation.nodes.map((node) => ({
            target: nodeTarget(node),
            html: node.html,
            failureSummary: node.failureSummary
          }))
        }))
      });

      for (const violation of severeViolations) {
        for (const node of violation.nodes) {
          blockers.push(`${route} ${violation.impact ?? 'unknown'} ${violation.id} ${nodeTarget(node)} (${violation.helpUrl})`);
        }
      }
    }

    await writeReport(testInfo, {
      gate: 'wcag-2.2-aa-core-pages',
      policy: 'fail-on-new-serious-or-critical-axe-violations',
      routes: routeReports,
      exceptions: exceptionRegistry
    });

    expect(blockers).toEqual([]);
  });
});
