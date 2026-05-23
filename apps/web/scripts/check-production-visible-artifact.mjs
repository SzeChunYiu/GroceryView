#!/usr/bin/env node

const defaultProductionUrl = 'https://grocery-web-mu.vercel.app/';
const productionUrl = process.env.GROCERYVIEW_PRODUCTION_URL || defaultProductionUrl;
const requiredVisibleSlugs = [
  'willys-odenplan',
  'ica-nara-sergels-torg',
  'coop-swedenborgsgatan',
  'lidl-sveavagen'
];
const requiredMinimumStoreSlugs = 6;
const requiredMinimumProductSlugs = 10;

function normalizeUrl(value) {
  const url = new URL(value);
  url.pathname = url.pathname || '/';
  return url.toString();
}

function extractDataSlugs(html, attributeName) {
  return new Set(
    Array.from(html.matchAll(new RegExp(`${attributeName}="([^"]+)"`, 'g')))
      .map((match) => match[1])
      .filter(Boolean)
  );
}

async function main() {
  const url = normalizeUrl(productionUrl);
  const response = await fetch(url, {
    headers: {
      'accept': 'text/html,application/xhtml+xml',
      'user-agent': 'GroceryView production-visible-artifact-check/1.0'
    }
  });

  if (!response.ok) {
    console.error(`Production visible artifact check failed: ${url} returned HTTP ${response.status}.`);
    process.exitCode = 1;
    return;
  }

  const html = await response.text();
  const missingSlugs = requiredVisibleSlugs.filter((slug) => !html.includes(slug));
  if (missingSlugs.length > 0) {
    console.error(`Production visible artifact is stale at ${url}; missing required store slugs: ${missingSlugs.join(', ')}.`);
    process.exitCode = 1;
    return;
  }

  const storeSlugs = extractDataSlugs(html, 'data-store-slug');
  if (storeSlugs.size < requiredMinimumStoreSlugs) {
    console.error(`Production visible artifact is stale at ${url}; found ${storeSlugs.size} data-store-slug entries, expected at least ${requiredMinimumStoreSlugs}.`);
    process.exitCode = 1;
    return;
  }

  const productSlugs = extractDataSlugs(html, 'data-product-slug');
  if (productSlugs.size < requiredMinimumProductSlugs) {
    console.error(`Production visible artifact is stale at ${url}; found ${productSlugs.size} data-product-slug entries, expected at least ${requiredMinimumProductSlugs}.`);
    process.exitCode = 1;
    return;
  }

  console.log(`Production visible artifact is current at ${url}; found ${storeSlugs.size} store slugs and ${productSlugs.size} product slugs.`);
}

main().catch((error) => {
  console.error('Production visible artifact check crashed:', error);
  process.exitCode = 1;
});
