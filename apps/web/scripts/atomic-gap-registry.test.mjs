import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const registryPath = new URL('../../../docs/roadmap/atomic-gap-registry.md', import.meta.url);
const webRoot = new URL('../', import.meta.url);
const repoRoot = new URL('../../../', import.meta.url);

const REQUIRED_FIELD_KEYWORDS = [
  'area',
  'severity',
  'pageOrFeature',
  'description',
  'userImpact',
  'fix',
  'testRequired',
  'status',
];

const GAP_ID_PATTERN = /^### `([a-z0-9-]+)`$/gm;
const SUMMARY_COUNT_PATTERN = /\| (open|in_progress|done) \| (\d+) \|/g;

const DONE_GAP_EVIDENCE = {
  'mvp-mover-category-slug-derivation': {
    file: 'src/lib/verified-data.ts',
    pattern: /categorySlug: product\.category/,
  },
  'market-table-missing-3m-1y': {
    file: 'src/app/market/page.tsx',
    pattern: />\s*3M\s*</,
  },
  'public-debug-copy-cursor-pagination': {
    file: 'src/app/search/page.tsx',
    pattern: /Showing .*matching products/,
  },
  'public-infra-copy-market-shell': {
    file: 'src/components/market-shell.tsx',
    pattern: /Redis cache/i,
    mustNotMatch: true,
  },
  'search-results-missing-evidence-strip': {
    file: 'src/components/preview/search-result-preview-card.tsx',
    pattern: /<EvidenceStrip/,
  },
  'metric-dictionary-not-centralized': {
    file: 'packages/metrics/src/definitions.ts',
    pattern: /canonicalDealScore/,
    repo: true,
  },
  'market-chain-index-no-chart': {
    file: 'src/app/market/page.tsx',
    pattern: /MultiLineChart/,
  },
};

const OPEN_GAP_PROBES = {
  'search-category-label-url': {
    file: 'packages/api/src/__tests__/routes.test.ts',
    pattern: /facets\.categories\.find\(\(facet\) => facet\.value === 'Dairy'\)/,
    repo: true,
  },
  'analytics-event-naming-gap': {
    followUp: async () => {
      const [analytics, spec, funnelTest] = await Promise.all([
        readFile(new URL('../src/lib/analytics.ts', import.meta.url), 'utf8'),
        readFile(new URL('../../../docs/specs/analytics-event-tracking.md', import.meta.url), 'utf8'),
        readFile(new URL('./funnel-analytics.test.mjs', import.meta.url), 'utf8'),
      ]);
      assert.match(spec, /deal_opened/);
      assert.doesNotMatch(analytics, /'deal_opened'/);
      assert.match(analytics, /GROCERYVIEW_ANALYTICS_EVENT_NAMES/);
      assert.doesNotMatch(funnelTest, /GROCERYVIEW_ANALYTICS_EVENT_NAMES/);
    },
  },
  'verified-data-fail-closed-banner-public': {
    file: 'src/app/data-sources/page.tsx',
    pattern: /fail closed until Redis cache/i,
  },
};

function evidenceRoot(entry) {
  return entry.repo ? repoRoot : webRoot;
}

function parseGapSections(source) {
  const gaps = [];
  for (const match of source.matchAll(GAP_ID_PATTERN)) {
    const id = match[1];
    const sectionStart = match.index ?? 0;
    const nextHeading = source.indexOf('\n### ', sectionStart + 1);
    const section = nextHeading === -1 ? source.slice(sectionStart) : source.slice(sectionStart, nextHeading);
    const statusMatch = section.match(/\| status \| (open|done|in_progress) \|/);
    gaps.push({ id, status: statusMatch?.[1] ?? 'unknown', section });
  }
  return gaps;
}

function parseSummaryCounts(source) {
  const counts = { open: 0, in_progress: 0, done: 0 };
  for (const match of source.matchAll(SUMMARY_COUNT_PATTERN)) {
    counts[match[1]] = Number.parseInt(match[2], 10);
  }
  return counts;
}

describe('atomic gap registry living spec', () => {
  it('exists at docs/roadmap/atomic-gap-registry.md', async () => {
    const source = await readFile(registryPath, 'utf8');
    assert.ok(source.length > 0, 'registry should not be empty');
    assert.match(source, /# Atomic gap registry/);
  });

  it('defines gap IDs and required fields for each open gap', async () => {
    const source = await readFile(registryPath, 'utf8');
    const ids = [...source.matchAll(GAP_ID_PATTERN)].map((match) => match[1]);
    assert.ok(ids.length >= 8, `expected at least 8 gap IDs, found ${ids.length}`);
    assert.equal(new Set(ids).size, ids.length, 'gap IDs must be unique');

    for (const id of ids) {
      const sectionStart = source.indexOf(`### \`${id}\``);
      assert.ok(sectionStart >= 0, `section for ${id} should exist`);
      const nextHeading = source.indexOf('\n### ', sectionStart + 1);
      const section = nextHeading === -1 ? source.slice(sectionStart) : source.slice(sectionStart, nextHeading);

      for (const field of REQUIRED_FIELD_KEYWORDS) {
        assert.match(
          section,
          new RegExp(`\\| ${field} \\|`),
          `${id} should document ${field}`,
        );
      }

      assert.match(section, /\| status \| (open|done|in_progress) \|/, `${id} should be tracked as open, done, or in_progress`);
    }
  });

  it('mentions required tests section and summary counts', async () => {
    const source = await readFile(registryPath, 'utf8');
    assert.match(source, /Required tests/i);
    assert.match(source, /Total gaps:/);
    assert.match(source, /atomic-gap-registry\.test\.mjs/);
  });

  it('summary counts match parsed gap statuses', async () => {
    const source = await readFile(registryPath, 'utf8');
    const gaps = parseGapSections(source);
    const summary = parseSummaryCounts(source);
    const actual = { open: 0, in_progress: 0, done: 0 };

    for (const gap of gaps) {
      assert.ok(['open', 'done', 'in_progress'].includes(gap.status), `${gap.id} has invalid status ${gap.status}`);
      actual[gap.status] += 1;
    }

    assert.equal(actual.open, summary.open, 'open count in summary table should match gap sections');
    assert.equal(actual.in_progress, summary.in_progress, 'in_progress count in summary table should match gap sections');
    assert.equal(actual.done, summary.done, 'done count in summary table should match gap sections');
    assert.equal(gaps.length, summary.open + summary.in_progress + summary.done, 'total gaps should equal status sum');
    assert.match(source, new RegExp(`\\*\\*Total gaps:\\*\\* ${gaps.length}`));
  });

  it('done gaps have code evidence and open gaps still reflect remaining work', async () => {
    const source = await readFile(registryPath, 'utf8');
    const gaps = parseGapSections(source);

    for (const gap of gaps) {
      if (gap.status === 'done') {
        const evidence = DONE_GAP_EVIDENCE[gap.id];
        assert.ok(evidence, `${gap.id} is done but missing DONE_GAP_EVIDENCE mapping`);
        const probeSource = await readFile(new URL(evidence.file, evidenceRoot(evidence)), 'utf8');
        if (evidence.mustNotMatch) {
          assert.doesNotMatch(probeSource, evidence.pattern, `${gap.id} should remain fixed in ${evidence.file}`);
        } else {
          assert.match(probeSource, evidence.pattern, `${gap.id} should remain fixed in ${evidence.file}`);
        }
      }

      if (gap.status === 'open') {
        const probe = OPEN_GAP_PROBES[gap.id];
        assert.ok(probe, `${gap.id} is open but missing OPEN_GAP_PROBES mapping`);
        if (probe.file) {
          const probeSource = await readFile(new URL(probe.file, evidenceRoot(probe)), 'utf8');
          assert.match(probeSource, probe.pattern, `${gap.id} should still be open in ${probe.file}`);
        }
        if (probe.followUp) {
          await probe.followUp();
        }
      }
    }
  });
});
