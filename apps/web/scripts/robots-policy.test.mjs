import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('robots.txt crawl policy', () => {
  it('keeps public product/category pages crawlable and private routes blocked', async () => {
    const robots = await read('public/robots.txt');

    assert.match(robots, /^User-agent: \*/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, /^Allow: \/products\/?$/m);
    assert.match(robots, /^Allow: \/categories\/?$/m);
    assert.match(robots, /^Disallow: \/account\/?$/m);
    assert.match(robots, /^Disallow: \/login$/m);
    assert.match(robots, /^Disallow: \/api\/?$/m);
    assert.match(robots, /^Disallow: \/admin\/?$/m);
    assert.match(robots, /^Disallow: \/users\/?$/m);
    assert.match(robots, /^Sitemap: \/sitemap\.xml$/m);
  });

  it('keeps generated Next robots metadata aligned with static robots.txt', async () => {
    const robotsRoute = await read('src/app/robots.ts');

    for (const route of ['/', '/products', '/categories']) {
      assert.match(robotsRoute, new RegExp(`['"]${route.replace('/', '\/')}['"]`));
    }
    for (const privateRoute of ['/account', '/login', '/api', '/admin', '/users']) {
      assert.match(robotsRoute, new RegExp(`['"]${privateRoute.replace('/', '\/')}['"]`));
    }
    assert.match(robotsRoute, /sitemapUrl/);
    assert.match(robotsRoute, /host: siteUrl/);
  });

});
