import { expect, type Locator, type Page, test } from '@playwright/test';

type StoreOption = 'ICA' | 'Willys';

const requestedStores: StoreOption[] = ['ICA', 'Willys'];

async function selectOptionByText(control: Locator, optionName: RegExp) {
  const matchingOption = control.locator('option').filter({ hasText: optionName }).first();
  await expect(matchingOption, `select contains ${optionName}`).toHaveCount(1);
  const value = await matchingOption.getAttribute('value');
  const label = (await matchingOption.textContent())?.trim();
  await control.selectOption(value ? { value } : { label: label ?? '' });
}

async function chooseCountry(page: Page, country: RegExp) {
  const countryControl = page.getByLabel(/country|market|region/i).first();
  await expect(countryControl, 'MyFlyer exposes a country/market control').toBeVisible();

  const tagName = await countryControl.evaluate((node) => node.tagName.toLowerCase());
  if (tagName === 'select') {
    await selectOptionByText(countryControl, country);
    return;
  }

  await countryControl.click();
  await page.getByRole('option', { name: country }).click();
}

async function pickStore(page: Page, storeName: StoreOption) {
  const storeOption = page.getByRole('checkbox', { name: new RegExp(storeName, 'i') }).first();
  await expect(storeOption, `MyFlyer exposes ${storeName} as a store checkbox`).toBeVisible();
  await storeOption.check();
}

async function switchAlgorithm(page: Page, algorithmName: RegExp) {
  const algorithmControl = page.getByLabel(/algorithm|ranking|sort|optimise|optimize/i).first();
  await expect(algorithmControl, 'MyFlyer exposes a ranking algorithm control').toBeVisible();

  const tagName = await algorithmControl.evaluate((node) => node.tagName.toLowerCase());
  if (tagName === 'select') {
    await selectOptionByText(algorithmControl, algorithmName);
    return;
  }

  const radio = page.getByRole('radio', { name: algorithmName }).first();
  if (await radio.count()) {
    await radio.check();
    return;
  }

  await algorithmControl.click();
  await page.getByRole('option', { name: algorithmName }).click();
}

async function expectSection(page: Page, name: RegExp): Promise<Locator> {
  const region = page.getByRole('region', { name }).first();
  await expect(region, `MyFlyer renders the ${name} section`).toBeVisible();
  return region;
}

test.describe('MyFlyer full flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, '__myFlyerPrintCalled', { configurable: true, value: false, writable: true });
      Object.defineProperty(window, '__myFlyerSharePayload', { configurable: true, value: null, writable: true });
      window.print = () => {
        window.__myFlyerPrintCalled = true;
      };
      Object.defineProperty(navigator, 'share', {
        configurable: true,
        value: async (payload: ShareData) => {
          window.__myFlyerSharePayload = payload;
        }
      });
    });
  });

  test('sets country, picks stores, switches algorithm, renders sections, prints, and shares', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => consoleErrors.push(error.message));

    await test.step('open MyFlyer and set country', async () => {
      await page.goto('/se/my-flyer');
      await expect(page.getByRole('heading', { name: /myflyer|my flyer|weekly flyer/i })).toBeVisible();
      await chooseCountry(page, /sweden|sverige|se/i);
      await expect(page.getByText(/sweden|sverige/i).first()).toBeVisible();
    });

    await test.step('pick two stores', async () => {
      for (const store of requestedStores) await pickStore(page, store);

      const selectedStores = await expectSection(page, /selected stores|store picks|picked stores/i);
      for (const store of requestedStores) {
        await expect(selectedStores.getByText(new RegExp(store, 'i'))).toBeVisible();
      }
    });

    await test.step('switch ranking algorithm', async () => {
      await switchAlgorithm(page, /max savings|maximum savings|savings first/i);
      await expect(page.getByText(/max savings|maximum savings|savings first/i).first()).toBeVisible();
    });

    await test.step('verify flyer sections render after personalization', async () => {
      await expectSection(page, /recommended offers|personalized deals|flyer deals/i);
      await expectSection(page, /weekly plan|aisle sections|shopping sections/i);
      await expect(page.locator('[data-my-flyer-offer], [data-flyer-card], article').first()).toBeVisible();
      await expect(page.getByText(/source|valid|offer|deal|savings/i).first()).toBeVisible();
    });

    await test.step('print the generated flyer', async () => {
      await page.getByRole('button', { name: /print/i }).click();
      await expect.poll(() => page.evaluate(() => window.__myFlyerPrintCalled)).toBe(true);
    });

    await test.step('share the generated flyer', async () => {
      await page.getByRole('button', { name: /share/i }).click();
      await expect
        .poll(() => page.evaluate(() => window.__myFlyerSharePayload && (window.__myFlyerSharePayload.title || window.__myFlyerSharePayload.url)))
        .toBeTruthy();
    });

    expect(consoleErrors).toEqual([]);
  });
});

declare global {
  interface Window {
    __myFlyerPrintCalled: boolean;
    __myFlyerSharePayload: ShareData | null;
  }
}
