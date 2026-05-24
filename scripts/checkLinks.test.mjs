import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canonicalizeInternalLink,
  discoverSitemapLinks,
  parseRouteManifestText
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
});
