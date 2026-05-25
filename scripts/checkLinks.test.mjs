import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';

import {
  canonicalizeInternalLink,
  discoverSitemapLinks,
  enforceRouteCap,
  parseRouteManifestText,
  readGuardrails,
  runLinkCheck
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

  it('reads conservative CI guardrails from environment values', () => {
    assert.deepEqual(readGuardrails({
      LINK_CHECK_TIMEOUT_MS: '2500',
      LINK_CHECK_MAX_MANIFEST_ROUTES: '12',
      LINK_CHECK_MAX_SITEMAP_LINKS: '25',
      LINK_CHECK_CACHE_DIR: '.cache/link-check'
    }), {
      requestTimeoutMs: 2500,
      maxManifestRoutes: 12,
      maxSitemapLinks: 25,
      cacheDir: '.cache/link-check'
    });

    assert.throws(
      () => readGuardrails({ LINK_CHECK_TIMEOUT_MS: '0' }),
      /LINK_CHECK_TIMEOUT_MS must be a positive integer/
    );
  });

  it('fails with a clear message when generated route sets exceed caps', async () => {
    assert.throws(
      () => enforceRouteCap(['/a', '/b', '/c'], 2, 'Sitemap', 'LINK_CHECK_MAX_SITEMAP_LINKS'),
      /Sitemap produced 3 routes, which exceeds LINK_CHECK_MAX_SITEMAP_LINKS=2/
    );

    const tempDir = mkdtempSync(join(tmpdir(), 'groceryview-link-check-'));
    try {
      const manifestPath = join(tempDir, 'routes-manifest.json');
      const sitemapPath = join(tempDir, 'sitemap.xml');
      writeFileSync(manifestPath, JSON.stringify({ pages: { '/': {}, '/products': {} } }));
      writeFileSync(sitemapPath, '<urlset><url><loc>/</loc></url></urlset>');

      await assert.rejects(
        () => runLinkCheck(manifestPath, sitemapPath, {
          requestTimeoutMs: 1000,
          maxManifestRoutes: 1,
          maxSitemapLinks: 5,
          cacheDir: '.link-check-cache-test'
        }),
        /Route manifest produced 2 routes, which exceeds LINK_CHECK_MAX_MANIFEST_ROUTES=1/
      );
    } finally {
      rmSync(tempDir, { force: true, recursive: true });
    }
  });
});
