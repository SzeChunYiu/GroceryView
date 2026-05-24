import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  canonicalizeInternalLink,
  compareRoutes,
  discoverSitemapLinks,
  linkCheckerOptionsFromEnv,
  maxPageGuard,
  parseRouteManifestText,
  runLinkChecker
} from './checkLinks.ts';

describe('checkLinks helpers', () => {
  it('parses route manifest route collections into unique sorted route paths', () => {
    const manifestText = JSON.stringify({
      pages: {
        '/': {},
        '/products': {},
        '/products/[slug]': {},
        'locales': ['en', 'fi'],
        '/about': {}
      },
      staticRoutes: {
        '/about': {},
        '/contact': {},
        '/contact': {},
        '/': {}
      },
      dynamicRoutes: {
        '/products/[slug]': ['/products/[slug]'],
        '/blog/[id]': '/blog/[id]'
      },
      i18n: {
        locales: ['en', 'fi']
      }
    });

    assert.deepEqual(parseRouteManifestText(manifestText), ['/','/about','/blog/[id]','/contact','/products','/products/[slug]']);
  });

  it('normalizes canonical links for internal absolute and relative targets', () => {
    assert.equal(canonicalizeInternalLink('https://grocery-web-mu.vercel.app/products/'), '/products');
    assert.equal(canonicalizeInternalLink('/products/'), '/products');
    assert.equal(canonicalizeInternalLink('https://grocery-web-mu.vercel.app/prices?from=web#anchor'), '/prices');
    assert.equal(canonicalizeInternalLink('https://other-origin.example.com/products'), null);
    assert.equal(canonicalizeInternalLink('mailto:test@example.com'), null);
    assert.equal(canonicalizeInternalLink('javascript:alert("hi")'), null);
    assert.equal(canonicalizeInternalLink('tel:+1234567'), null);
  });

  it('discovers sitemap links and normalizes route values', () => {
    const sitemapText = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset>
        <url><loc>https://grocery-web-mu.vercel.app/products/</loc></url>
        <url><loc>https://grocery-web-mu.vercel.app/products?variant=grid</loc></url>
        <url><loc>/contact/</loc></url>
        <url><loc>https://other-origin.example.com/contact</loc></url>
        <url><loc>mailto:team@groceryview.com</loc></url>
        <url><loc>https://grocery-web-mu.vercel.app/</loc></url>
      </urlset>`;

    assert.deepEqual(discoverSitemapLinks(sitemapText), ['/', '/contact', '/products']);
  });

  it('applies conservative max-page caps with actionable failure output', () => {
    assert.doesNotThrow(() => maxPageGuard('sitemap', ['/', '/products'], 2));
    assert.throws(
      () => maxPageGuard('sitemap', ['/', '/products', '/stores'], 2),
      /sitemap discovered 3 routes, above CHECK_LINKS_MAX_PAGES=2\. Sample: \/, \/products, \/stores/
    );
  });

  it('parses CI runtime controls from environment values with safe defaults', () => {
    assert.deepEqual(linkCheckerOptionsFromEnv({}), {
      baseUrl: 'https://grocery-web-mu.vercel.app',
      requestTimeoutMs: 10000,
      maxPages: 50000
    });
    assert.deepEqual(linkCheckerOptionsFromEnv({
      CHECK_LINKS_BASE_URL: 'https://example.test',
      CHECK_LINKS_REQUEST_TIMEOUT_MS: '2500',
      CHECK_LINKS_MAX_PAGES: '4'
    }), {
      baseUrl: 'https://example.test',
      requestTimeoutMs: 2500,
      maxPages: 4
    });
  });

  it('runs the checker against local files and reports actionable route differences', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'check-links-'));
    const manifestPath = join(dir, 'routes-manifest.json');
    const sitemapPath = join(dir, 'sitemap.xml');
    writeFileSync(manifestPath, JSON.stringify({ pages: { '/': {}, '/products': {}, '/about': {} } }));
    writeFileSync(sitemapPath, `<urlset>
      <url><loc>https://grocery-web-mu.vercel.app/</loc></url>
      <url><loc>https://grocery-web-mu.vercel.app/products</loc></url>
      <url><loc>https://grocery-web-mu.vercel.app/orphan</loc></url>
    </urlset>`);

    const result = await runLinkChecker(manifestPath, sitemapPath, { maxPages: 10 });

    assert.deepEqual(result.manifestRoutes, ['/', '/about', '/products']);
    assert.deepEqual(result.sitemapRoutes, ['/', '/orphan', '/products']);
    assert.deepEqual(compareRoutes(result.manifestRoutes, result.sitemapRoutes), {
      missingFromSitemap: ['/about'],
      sitemapOnlyRoutes: ['/orphan']
    });
  });
});
