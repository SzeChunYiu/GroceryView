#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function has(relativePath, pattern) {
  if (!existsSync(path.join(repoRoot, relativePath))) return false;
  return pattern.test(read(relativePath));
}

const checks = [
  {
    id: 'ad_label_exact',
    label: 'AdSlot label exactly Advertisement',
    pass: has('apps/web/src/components/design-system/ad-slot.tsx', /label = 'Advertisement'[\s\S]*aria-label=\{label\}/)
  },
  {
    id: 'ad_free_sensitive_routes',
    label: 'Ads blocked on admin, account, privacy, auth, and sensitive pharmacy routes',
    pass: ['/admin', '/account', '/privacy', '/auth', '/pharmacy/prescription', '/pharmacy/rx'].every((route) =>
      read('apps/web/src/lib/ad-policy.ts').includes(route)
    )
  },
  {
    id: 'search_ad_after_result_12',
    label: 'Search ad allowed only after result 12',
    pass: has('apps/web/src/lib/ad-policy.ts', /searchAdAllowedAfterIndex[\s\S]*resultIndex >= 12/) &&
      has('apps/web/src/lib/ad-slots.ts', /search_after_results_12/)
  },
  {
    id: 'no_nested_ads',
    label: 'Ad placement policy rejects nested cards, tables, charts, and maps',
    pass: has('apps/web/src/lib/ad-policy.ts', /surface !== 'nested'/)
  },
  {
    id: 'live_adsense_deferred',
    label: 'live_adsense_fill deferred until credentials, consent, and visibility are ready',
    pass: has('apps/web/src/lib/third-party-loading.ts', /id: 'live_adsense_fill'[\s\S]*consentCategory: 'ads'[\s\S]*loadTrigger: 'consent\+visibility'[\s\S]*maxInitialJsBytes: 0[\s\S]*No ad script is loaded today/)
  },
  {
    id: 'preview_accessibility',
    label: 'Preview drawers are keyboard reachable, closable, Escape-aware, focus-restoring, and named',
    pass: ['FOCUSABLE_SELECTOR', 'Escape', 'restoreFocusRef', 'aria-labelledby', 'aria-modal', 'Close preview'].every((needle) =>
      read('apps/web/src/components/preview/preview-drawer.tsx').includes(needle)
    )
  },
  {
    id: 'visual_accessibility',
    label: 'Charts and maps provide aria-labels, plain summaries, table fallbacks, and non-color signal copy',
    pass: ['aria-label', 'plainSummary', 'ChartTableFallback', 'Color is not the only signal'].every((needle) =>
      read('apps/web/src/components/mvp/visual-intelligence.tsx').includes(needle)
    )
  },
  {
    id: 'manual_qa_docs',
    label: 'Manual UX/accessibility, smoke, and production readiness checklists exist',
    pass: [
      'docs/qa/manual-ux-accessibility-checklist.md',
      'docs/qa/manual-smoke-test-plan.md',
      'docs/release/production-readiness-checklist.md'
    ].every((relativePath) => existsSync(path.join(repoRoot, relativePath)))
  },
  {
    id: 'release_gate_commands',
    label: 'Production readiness checklist names required release gate commands',
    pass: has('docs/release/production-readiness-checklist.md', /npm run test -w @groceryview\/web[\s\S]*npx tsc --noEmit[\s\S]*node scripts\/ops\/release-readiness-report\.mjs/)
  },
  {
    id: 'closure_tests',
    label: 'Closure tests cover ads, previews, visuals, content copy, and release readiness',
    pass: [
      'apps/web/scripts/ad-slot-contracts.test.mjs',
      'apps/web/scripts/interactive-preview-contracts.test.mjs',
      'apps/web/scripts/visual-intelligence-system.test.mjs',
      'apps/web/scripts/content-copy-audit.test.mjs',
      'apps/web/scripts/release-readiness-report.test.mjs'
    ].every((relativePath) => existsSync(path.join(repoRoot, relativePath)))
  }
];

const blocked = checks.filter((check) => !check.pass);
const report = {
  reportType: 'release_readiness_report',
  generatedAt: new Date().toISOString(),
  status: blocked.length === 0 ? 'ready' : 'blocked',
  summary: {
    total: checks.length,
    passed: checks.length - blocked.length,
    blocked: blocked.length
  },
  rows: checks.map((check) => ({
    id: check.id,
    label: check.label,
    status: check.pass ? 'pass' : 'blocked'
  }))
};

process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (blocked.length > 0) process.exitCode = 1;
