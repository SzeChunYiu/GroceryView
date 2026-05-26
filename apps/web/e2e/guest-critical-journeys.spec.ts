import type { Page } from '@playwright/test';
import { expect, test } from './fixtures/base';
import {
  expectAtLeastOneFocusableElementReachable,
  expectNoBrokenImages
} from './pages/page-smoke';

type GuestJourney = {
  dataText: RegExp;
  evidenceText: RegExp;
  heading: RegExp;
  name: string;
  path: string;
};

const guestJourneys: GuestJourney[] = [
  {
    name: 'homepage',
    path: '/',
    heading: /readable prices, explicit sources, zero placeholder rows/i,
    dataText: /Grocery Index|OpenPrices observation|source coverage/i,
    evidenceText: /verified|source|confidence|observed/i
  },
  {
    name: 'product detail',
    path: '/products/makaroner-pasta-101302991-st',
    heading: /Makaroner Pasta/i,
    dataText: /Willys|Hemköp|12,20 kr|17,93 kr/i,
    evidenceText: /confidence|observed|source|No forecast/i
  },
  {
    name: 'search',
    path: '/search?q=havregryn',
    heading: /Verified product catalogue/i,
    dataText: /Havregryn|result|Search/i,
    evidenceText: /real product|source|verified|server-backed/i
  },
  {
    name: 'compare',
    path: '/compare?products=makaroner-pasta-101302991-st,havregryn-extra-fylliga-101758934-st',
    heading: /Comparable chain prices/i,
    dataText: /Makaroner Pasta|Havregryn Extra Fylliga|Willys|Hemköp/i,
    evidenceText: /confidence|source|generated|missing/i
  },
  {
    name: 'map',
    path: '/map',
    heading: /Store coordinates with chain-index signals/i,
    dataText: /Interactive store map|OSM stores|chain-index/i,
    evidenceText: /verified|source|coverage|confidence/i
  },
  {
    name: 'deals',
    path: '/deals',
    heading: /Verified grocery deals/i,
    dataText: /price drops|Top local drops|Freshly observed products/i,
    evidenceText: /observed|source|verified|Snapshot/i
  },
  {
    name: 'weekly basket',
    path: '/weekly-basket',
    heading: /weekly basket|cheapest route/i,
    dataText: /basket optimizer|split-shop|coverage confidence/i,
    evidenceText: /confidence|source|verified|coverage/i
  }
];

async function expectVisibleEvidence(pageText: string, journey: GuestJourney) {
  expect(pageText).toMatch(journey.dataText);
  expect(pageText).toMatch(journey.evidenceText);
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflowPx = await page.evaluate(() =>
    Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)
  );
  expect(overflowPx).toBeLessThanOrEqual(2);
}

test.describe('guest critical journeys', () => {
  test.setTimeout(120_000);

  for (const journey of guestJourneys) {
    test(`${journey.name} renders guest data with source evidence`, async ({ consoleErrorCapture, gotoApp, page }) => {
      await gotoApp(journey.path);

      await expect(page.getByRole('heading', { name: journey.heading }).first()).toBeVisible();
      await expectVisibleEvidence(await page.locator('body').innerText(), journey);
      await expectAtLeastOneFocusableElementReachable(page);
      await expectNoBrokenImages(page);
      expect(consoleErrorCapture.errors).toEqual([]);
    });
  }

  test('critical guest routes fit a mobile viewport without horizontal overflow', async ({ consoleErrorCapture, gotoApp, page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const journey of guestJourneys) {
      await gotoApp(journey.path);
      await expect(page.getByRole('heading', { name: journey.heading }).first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectVisibleEvidence(await page.locator('body').innerText(), journey);
    }

    expect(consoleErrorCapture.errors).toEqual([]);
  });

  test('market switcher keeps guest shoppers on verified adjacent markets', async ({ consoleErrorCapture, gotoApp, page }) => {
    await gotoApp('/');

    await page.getByRole('link', { name: /Open pharmacy OTC board/i }).click();
    await expect(page.getByText(/Pharmacy catalog/i).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: /EAN-coded OTC/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/OTC|public evidence|source/i);

    await gotoApp('/fuel');
    await expect(page.getByRole('heading', { name: /Fuel prices by grade/i })).toBeVisible();
    await expect(page.locator('body')).toContainText(/Captured|source|operator/i);
    await expectNoHorizontalOverflow(page);
    expect(consoleErrorCapture.errors).toEqual([]);
  });
});
