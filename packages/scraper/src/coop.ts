import { BrowserPool } from './browserPool.js';

export type CoopScrapedProduct = {
  capturedAt: string;
  currency: 'SEK';
  name: string;
  price: number;
  priceText: string;
  productUrl: string;
  sourceUrl: string;
  unitPriceText: string;
};

export type CoopScrapeOptions = {
  categoryPath?: string;
  maxScrolls?: number;
  query?: string;
};

const COOP_BASE_URL = 'https://www.coop.se/handla/';

function coopListingUrl(options: CoopScrapeOptions) {
  if (options.query) {
    const url = new URL(COOP_BASE_URL);
    url.searchParams.set('q', options.query);
    return url.toString();
  }

  return new URL(options.categoryPath?.replace(/^\//, '') ?? '', COOP_BASE_URL).toString();
}

function parseSekPrice(value: string) {
  const normalized = value.replace(/\s/g, '').replace(/[^0-9,:.-]/g, '').replace(',', '.');
  const price = Number.parseFloat(normalized);
  return Number.isFinite(price) ? price : null;
}

export async function scrapeCoopProducts(pool: BrowserPool, options: CoopScrapeOptions = {}): Promise<CoopScrapedProduct[]> {
  const sourceUrl = coopListingUrl(options);
  const capturedAt = new Date().toISOString();

  return pool.withPage(async (page) => {
    await page.goto(sourceUrl, { waitUntil: 'networkidle', timeout: 45_000 });

    for (let index = 0; index < (options.maxScrolls ?? 5); index += 1) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await page.waitForTimeout?.(650);
    }

    const rows = await page.evaluate(() => {
      const cardSelectors = [
        '[data-testid*="product"]',
        '[data-cy*="product"]',
        'article',
        'li[class*="Product"]'
      ];
      const cards = Array.from(new Set(cardSelectors.flatMap((selector) => Array.from(document.querySelectorAll<HTMLElement>(selector)))));

      return cards.map((card) => {
        const link = card.querySelector<HTMLAnchorElement>('a[href*="/handla/varor/"]') ?? card.querySelector<HTMLAnchorElement>('a[href]');
        const name = card.querySelector<HTMLElement>('[data-testid*="name"], h2, h3, [class*="name" i]')?.innerText.trim() ?? link?.innerText.trim() ?? '';
        const priceText = card.querySelector<HTMLElement>('[data-testid*="price"], [class*="price" i]')?.innerText.trim() ?? '';
        const unitPriceText = card.querySelector<HTMLElement>('[data-testid*="compare"], [class*="unit" i], [class*="compare" i]')?.innerText.trim() ?? '';

        return {
          name,
          priceText,
          productUrl: link?.href ?? '',
          unitPriceText
        };
      });
    });

    return rows.flatMap((row) => {
      const price = parseSekPrice(row.priceText);
      if (!row.name || !row.productUrl || price === null) return [];

      return [{
        capturedAt,
        currency: 'SEK' as const,
        name: row.name,
        price,
        priceText: row.priceText,
        productUrl: row.productUrl,
        sourceUrl,
        unitPriceText: row.unitPriceText
      }];
    });
  });
}
