import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const lazyItemCard = new URL('../src/components/LazyItemCard.tsx', import.meta.url);
const productCards = new URL('../src/components/product-price-cards.tsx', import.meta.url);
const dealCard = new URL('../src/components/deal-card.tsx', import.meta.url);

test('lazy item cards expose above-fold image loading metadata', async () => {
  const source = await readFile(lazyItemCard, 'utf8');

  assert.match(source, /aboveFold\?: boolean/);
  assert.match(source, /aboveFold = false/);
  assert.match(source, /data-image-loading=\{aboveFold \? 'eager' : 'lazy'\}/);
});

test('product cards optimize verified images responsively with blur and above-fold eager loading', async () => {
  const source = await readFile(productCards, 'utf8');

  assert.match(source, /const aboveFoldProductCardCount = 3/);
  assert.match(source, /const isAboveFold = index < aboveFoldProductCardCount/);
  assert.match(source, /aboveFold=\{isAboveFold\}/);
  assert.match(source, /placeholder="blur"/);
  assert.match(source, /blurDataURL=\{productImageBlurDataUrl\}/);
  assert.match(source, /preload=\{isAboveFold\}/);
  assert.match(source, /loading=\{isAboveFold \? 'eager' : 'lazy'\}/);
  assert.match(source, /fetchPriority=\{isAboveFold \? 'high' : 'auto'\}/);
  assert.match(source, /sizes="\(min-width: 1280px\) 16vw, \(min-width: 768px\) 33vw, 80vw"/);
});

test('deal cards support optimized optional deal imagery without eager loading below the fold', async () => {
  const source = await readFile(dealCard, 'utf8');

  assert.match(source, /import Image from 'next\/image';/);
  assert.match(source, /imageUrl\?: string \| null/);
  assert.match(source, /isAboveFold\?: boolean/);
  assert.match(source, /fill/);
  assert.match(source, /placeholder="blur"/);
  assert.match(source, /blurDataURL=\{dealImageBlurDataUrl\}/);
  assert.match(source, /preload=\{isAboveFold\}/);
  assert.match(source, /loading=\{isAboveFold \? 'eager' : 'lazy'\}/);
  assert.match(source, /sizes="\(min-width: 1024px\) 6rem, 5rem"/);
});
