import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const source = await readFile(new URL('../src/components/app-nav.tsx', import.meta.url), 'utf8');

const expectedGroups = [
  {
    key: 'markets',
    links: ['/', '/chain-index', '/analytics/funnel', '/categories', '/heatmap', '/screener']
  },
  {
    key: 'products',
    links: ['/products', '/new-arrivals', '/compare']
  },
  {
    key: 'stores',
    links: ['/map', '/stores']
  },
  {
    key: 'trip',
    links: ['/scanner', '/list', '/screener', '/watchlist']
  },
  {
    key: 'personal',
    links: ['/savings-dashboard', '/stockholm/my-flyer', '/weekly-basket', '/meal-planner', '/pantry-inventory', '/contact']
  }
];

function buildNavGroupSegment(groupKey) {
  const marker = `label: t('app-nav.groups.${groupKey}')`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing AppNav group ${groupKey}`);

  const nextStarts = expectedGroups
    .filter((group) => group.key !== groupKey)
    .map((group) => source.indexOf(`label: t('app-nav.groups.${group.key}')`, start + marker.length))
    .filter((index) => index > start);
  const end = nextStarts.length > 0 ? Math.min(...nextStarts) : source.indexOf('const installBannerDismissedKey', start);

  return source.slice(start, end);
}

test('AppNav keeps required navigation groups and child links stable', () => {
  assert.match(source, /const navContractLabels = \[/);
  assert.match(source, /const navGroups = buildNavGroups\(t\)/);
  assert.match(source, /const mobileNavItems = navGroups\.flatMap\(\(group\) => group\.items\)/);

  for (const group of expectedGroups) {
    const segment = buildNavGroupSegment(group.key);
    for (const href of group.links) {
      assert.match(segment, new RegExp(`href: '${href.replaceAll('/', '\\/')}'`), `${group.key} missing ${href}`);
    }
  }
});
