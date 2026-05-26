import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import {
  getCoreWebVitalsDashboard,
  recordCoreWebVitalEvents,
  resetCoreWebVitalsDashboardForTests
} from '../core-web-vitals';

afterEach(() => resetCoreWebVitalsDashboardForTests());

test('records privacy-safe Core Web Vitals segments and strips route queries', () => {
  const result = recordCoreWebVitalEvents([
    {
      connection: '4g',
      device: 'mobile',
      market: 'se',
      metric: 'LCP',
      route: '/products?q=milk',
      value: 2400
    },
    {
      connection: '4g',
      device: 'mobile',
      market: 'se',
      metric: 'CLS',
      route: 'https://example.test/products/123456?user=abc',
      value: 0.08
    }
  ]);

  assert.deepEqual(result, { accepted: 2, rejected: 0 });
  const dashboard = getCoreWebVitalsDashboard('2026-05-25T00:00:00.000Z');
  assert.equal(dashboard.observationCount, 2);
  assert.equal(dashboard.segments.find((segment) => segment.metric === 'LCP')?.route, '/products');
  assert.equal(dashboard.segments.find((segment) => segment.metric === 'CLS')?.route, '/products/:id');
});

test('rejects invalid or privacy-hostile Core Web Vitals events', () => {
  const result = recordCoreWebVitalEvents([
    { connection: '5g', device: 'mobile', market: 'se', metric: 'LCP', route: '/products', value: 2400 },
    { connection: '4g', device: 'mobile', market: 'sweden', metric: 'LCP', route: '/products', value: 2400 },
    { connection: '4g', device: 'mobile', market: 'se', metric: 'FID', route: '/products', value: 20 },
    { connection: '4g', device: 'mobile', market: 'se', metric: 'CLS', route: '/products', value: -0.1 }
  ]);

  assert.deepEqual(result, { accepted: 0, rejected: 4 });
  assert.equal(getCoreWebVitalsDashboard().available, false);
});

test('computes p75 and raises regression alerts for poor segments', () => {
  const result = recordCoreWebVitalEvents([1200, 2600, 4200, 5200].map((value) => ({
    connection: '3g',
    device: 'desktop',
    market: 'se',
    metric: 'LCP',
    route: '/compare',
    value
  })));

  assert.deepEqual(result, { accepted: 4, rejected: 0 });
  const dashboard = getCoreWebVitalsDashboard();
  assert.equal(dashboard.segments[0].p75, 4200);
  assert.equal(dashboard.segments[0].rating, 'poor');
  assert.equal(dashboard.alerts[0].severity, 'regression');
});
