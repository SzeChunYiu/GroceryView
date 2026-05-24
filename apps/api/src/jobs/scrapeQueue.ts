import { BrowserPool, type BrowserFactory } from '../../../../packages/scraper/src/browserPool.js';
import { scrapeCoopProducts, type CoopScrapedProduct, type CoopScrapeOptions } from '../../../../packages/scraper/src/coop.js';

export type ScrapeQueueJob = {
  options?: CoopScrapeOptions;
  retailer: 'coop';
};

export type ScrapeQueueResult = {
  captured: CoopScrapedProduct[];
  job: ScrapeQueueJob;
};

export async function runScrapeQueue(jobs: readonly ScrapeQueueJob[], createBrowser: BrowserFactory): Promise<ScrapeQueueResult[]> {
  const pool = new BrowserPool(createBrowser, { maxPages: 2 });

  try {
    const results: ScrapeQueueResult[] = [];
    for (const job of jobs) {
      if (job.retailer !== 'coop') continue;
      results.push({ job, captured: await scrapeCoopProducts(pool, job.options) });
    }
    return results;
  } finally {
    await pool.close();
  }
}
