import { expect, test, type Locator, type Page } from './fixtures/base';

const consentPolicyVersion = '2026-05-22-consent-v1';
const consentStorageKey = 'groceryview:consent:state';
const keyboardRoutes = [
  { route: '/', surface: 'nav dropdowns and homepage actions', minTabStops: 8 },
  { route: '/products', surface: 'product search filters', minTabStops: 8 },
  { route: '/screener', surface: 'screener table sort and filter controls', minTabStops: 8 },
  { route: '/compare?products=makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st', surface: 'chart controls and compare filters', minTabStops: 10 },
  { route: '/map', surface: 'map list and route cards', minTabStops: 8 },
  { route: '/basket', surface: 'basket edit controls', minTabStops: 8 },
  { route: '/settings', surface: 'settings dialogs and preference controls', minTabStops: 8 }
] as const;

type FocusSnapshot = {
  label: string;
  orderIndex: number;
  signature: string;
  visible: boolean;
  visibleFocus: boolean;
};

function storedConsent() {
  return JSON.stringify({
    policyVersion: consentPolicyVersion,
    categories: { necessary: true, analytics: false, ads: false, personalisation: false }
  });
}

async function seedRejectedConsent(page: Page) {
  await page.addInitScript(({ key, value }) => {
    window.localStorage.setItem(key, value);
    window.localStorage.setItem('groceryview:install-banner-dismissed', 'true');
  }, { key: consentStorageKey, value: storedConsent() });
}

async function clearConsent(page: Page) {
  await page.addInitScript(({ key }) => {
    window.localStorage.removeItem(key);
    window.localStorage.removeItem('groceryview:consent:audit');
    window.localStorage.setItem('groceryview:install-banner-dismissed', 'true');
  }, { key: consentStorageKey });
}

async function activeFocusSnapshot(page: Page): Promise<FocusSnapshot | null> {
  return page.evaluate(() => {
    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[role="button"]:not([aria-disabled="true"])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return null;

    const focusable = Array.from(document.querySelectorAll<HTMLElement>(focusableSelector))
      .filter((item) => {
        const rect = item.getBoundingClientRect();
        const style = window.getComputedStyle(item);
        return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
      });
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const outlineWidth = Number.parseFloat(style.outlineWidth || '0');
    const visible = rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden';
    const label = element.getAttribute('aria-label') ?? element.textContent?.replace(/\s+/g, ' ').trim() ?? element.tagName.toLowerCase();
    const signature = `${element.tagName.toLowerCase()}:${label.slice(0, 80)}:${focusable.indexOf(element)}`;
    return {
      label,
      orderIndex: focusable.indexOf(element),
      signature,
      visible,
      visibleFocus: element.matches(':focus-visible')
        || style.outlineStyle === 'auto'
        || (style.outlineStyle !== 'none' && outlineWidth > 0)
        || style.boxShadow !== 'none'
    };
  });
}

async function focusWithTab(page: Page, target: Locator, maxTabs = 60) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press('Tab');
    const focused = await target.evaluate((element) => element === document.activeElement || element.contains(document.activeElement)).catch(() => false);
    if (focused) return;
  }
  throw new Error('Target was not reachable with Tab.');
}

test('consent manager can be completed from keyboard only', async ({ page, gotoApp }) => {
  await clearConsent(page);
  await gotoApp('/');

  const rejectAll = page.getByRole('button', { name: 'Reject all' });
  await expect(rejectAll).toBeVisible();
  await focusWithTab(page, rejectAll);
  const focusedReject = await activeFocusSnapshot(page);
  expect(focusedReject?.visible).toBe(true);
  expect(focusedReject?.visibleFocus).toBe(true);

  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Cookie settings' })).toBeVisible();
});

for (const route of keyboardRoutes) {
  test(`keyboard order and visible focus stay usable for ${route.surface}`, async ({ page, gotoApp }) => {
    await seedRejectedConsent(page);
    await gotoApp(route.route);

    const snapshots: FocusSnapshot[] = [];
    const seen = new Set<string>();
    const maxTabs = 48;

    for (let index = 0; index < maxTabs && seen.size < route.minTabStops; index += 1) {
      await page.keyboard.press('Tab');
      const snapshot = await activeFocusSnapshot(page);
      if (!snapshot || !snapshot.visible) continue;
      snapshots.push(snapshot);
      seen.add(snapshot.signature);
    }

    const uniqueSnapshots = snapshots.filter((snapshot, index, all) => all.findIndex((item) => item.signature === snapshot.signature) === index);
    expect(uniqueSnapshots.length, `${route.route} should expose enough keyboard stops for ${route.surface}`).toBeGreaterThanOrEqual(route.minTabStops);
    expect(uniqueSnapshots.every((snapshot) => snapshot.visibleFocus), `${route.route} must render visible focus for every audited stop`).toBe(true);

    const firstPass = uniqueSnapshots.slice(0, route.minTabStops);
    for (let index = 1; index < firstPass.length; index += 1) {
      expect(firstPass[index].orderIndex, `${route.route} should move forward through DOM order before wrapping`).toBeGreaterThan(firstPass[index - 1].orderIndex);
    }

    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
  });
}
