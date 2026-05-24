import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const lazyItemCard = new URL('../src/components/LazyItemCard.tsx', import.meta.url);
const analytics = new URL('../src/lib/analytics.ts', import.meta.url);
const intersectionHook = new URL('../src/hooks/useIntersectionObserver.ts', import.meta.url);
const productCards = new URL('../src/components/product-price-cards.tsx', import.meta.url);
const apiRoute = new URL('../src/app/api/analytics/item-card-impressions/route.ts', import.meta.url);

test('product cards use lazy item cards with impression metadata', async () => {
  const source = await readFile(productCards, 'utf8');

  assert.match(source, /import \{ LazyItemCard \} from '\.\/LazyItemCard';/);
  assert.match(source, /<LazyItemCard/);
  assert.match(source, /itemId=\{card\.slug\}/);
  assert.match(source, /itemName=\{card\.name\}/);
  assert.match(source, /listId="adaptive-product-cards"/);
  assert.match(source, /listIndex=\{index\}/);
});

test('lazy item card observes viewport entry once before tracking an impression', async () => {
  const source = await readFile(lazyItemCard, 'utf8');

  assert.match(source, /useIntersectionObserver<HTMLAnchorElement>/);
  assert.match(source, /freezeOnceVisible: true/);
  assert.match(source, /hasTrackedImpression\.current/);
  assert.match(source, /trackItemCardImpression\(\{ compareMode, itemId, itemName, listId, listIndex \}\)/);
});

test('analytics batches item card impressions without console output', async () => {
  const source = await readFile(analytics, 'utf8');

  assert.match(source, /const maxBatchSize = 20/);
  assert.match(source, /const flushDelayMs = 1200/);
  assert.match(source, /navigator\.sendBeacon/);
  assert.match(source, /keepalive: true/);
  assert.doesNotMatch(source, /console\./);
});

test('intersection hook uses IntersectionObserver and disconnects cleanly', async () => {
  const source = await readFile(intersectionHook, 'utf8');

  assert.match(source, /new IntersectionObserver/);
  assert.match(source, /observer\.observe\(target\)/);
  assert.match(source, /observer\.disconnect\(\)/);
});

test('analytics route accepts bounded impression batches', async () => {
  const source = await readFile(apiRoute, 'utf8');

  assert.match(source, /events\.length === 0 \|\| events\.length > 20/);
  assert.match(source, /events\.every\(isValidImpression\)/);
  assert.match(source, /accepted: events\.length/);
});
