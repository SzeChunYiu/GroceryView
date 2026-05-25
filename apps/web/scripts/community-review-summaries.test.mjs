import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const appRoot = new URL('..', import.meta.url);

async function read(path) {
  return readFile(new URL(path, appRoot), 'utf8');
}

test('product pages and cards expose aggregate community review summaries', async () => {
  const communityReviews = await read('src/lib/community-reviews.ts');
  const productPage = await read('src/app/products/[slug]/page.tsx');
  const productCards = await read('src/components/product-price-cards.tsx');
  const verifiedData = await read('src/lib/verified-data.ts');

  assert.match(communityReviews, /CommunityReviewSummaryMetric = 'taste' \| 'value' \| 'freshness'/);
  assert.match(communityReviews, /communityReviewSummaryForProduct/);
  assert.match(communityReviews, /aggregate taste, value, and freshness snippets/);
  assert.match(communityReviews, /do not expose reviewer identities or invent individual review text/);

  assert.match(productPage, /communityReviewSummaryForProduct/);
  assert.match(productPage, /Taste, value, and freshness snippets/);
  assert.match(productPage, /data-community-review-snippet=\{snippet\.metric\}/);
  assert.match(productPage, /private-label and perishable comparisons are not price-only/);

  assert.match(verifiedData, /communityReviewSummary: CommunityReviewSummary/);
  assert.match(verifiedData, /communityReviewSummaryForProduct/);
  assert.match(productCards, /data-community-review-summary=\{card\.slug\}/);
  assert.match(productCards, /card\.communityReviewSummary\.snippets/);
});
