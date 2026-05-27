import { expect, test } from '@playwright/test';

const longSessionRoutes = [
  { name: 'map', path: '/map' },
  { name: 'product chart', path: '/products' },
  { name: 'screener', path: '/screener' },
  { name: 'compare', path: '/compare' }
] as const;

test.describe('long-lived shopping session memory checks', () => {
  test('repeated map/chart/screener/compare navigation does not grow listeners or heap without bound', async ({ page, browserName }) => {
    await page.addInitScript(() => {
      const counts = new Map<string, number>();
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;

      Object.defineProperty(window, '__groceryviewListenerCounts', {
        configurable: true,
        value: counts
      });

      EventTarget.prototype.addEventListener = function patchedAdd(type, listener, options) {
        counts.set(String(type), (counts.get(String(type)) ?? 0) + 1);
        return originalAdd.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function patchedRemove(type, listener, options) {
        counts.set(String(type), Math.max(0, (counts.get(String(type)) ?? 0) - 1));
        return originalRemove.call(this, type, listener, options);
      };
    });

    const samples: Array<{ heap: number; listeners: number; route: string }> = [];
    for (let cycle = 0; cycle < 3; cycle += 1) {
      for (const route of longSessionRoutes) {
        await page.goto(route.path);
        await page.waitForLoadState('networkidle');
        await page.mouse.move(120 + cycle * 8, 160 + cycle * 6);
        await page.keyboard.press('Tab');
        const sample = await page.evaluate((routeName) => {
          const listenerCounts = window.__groceryviewListenerCounts as Map<string, number> | undefined;
          const listeners = listenerCounts ? [...listenerCounts.values()].reduce((sum, count) => sum + count, 0) : 0;
          const memory = (performance as Performance & { memory?: { usedJSHeapSize?: number } }).memory;
          return {
            heap: memory?.usedJSHeapSize ?? 0,
            listeners,
            route: String(routeName)
          };
        }, route.name);
        samples.push(sample);
      }
    }

    const first = samples[0];
    const last = samples.at(-1);
    expect(first).toBeTruthy();
    expect(last).toBeTruthy();
    if (!first || !last) return;

    const listenerGrowth = last.listeners - first.listeners;
    expect(listenerGrowth, `listener growth across routes: ${JSON.stringify(samples)}`).toBeLessThanOrEqual(80);

    if (browserName === 'chromium' && first.heap > 0 && last.heap > 0) {
      const heapGrowth = last.heap - first.heap;
      expect(heapGrowth, `heap growth across routes: ${JSON.stringify(samples)}`).toBeLessThanOrEqual(25 * 1024 * 1024);
    }
  });
});

declare global {
  interface Window {
    __groceryviewListenerCounts?: Map<string, number>;
  }
}
