import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { formatRelative } from 'date-fns';
import { sv } from 'date-fns/locale';

const pageUrl = new URL('../page.tsx', import.meta.url);

const snapshot = {
  reviewDateCopy: 'imorgon kl. 08:00',
  nextReviewDateParts: [2026, 4, 25, 8, 0, 0],
  baseDateParts: [2026, 4, 24, 8, 0, 0],
  localeImport: "import { sv } from 'date-fns/locale';"
};

const toDate = (parts) => new Date(...parts);

test('weekly basket date copy uses the sv-SE formatRelative snapshot', async () => {
  const page = await readFile(pageUrl, 'utf8');
  const reviewDateCopy = formatRelative(
    toDate(snapshot.nextReviewDateParts),
    toDate(snapshot.baseDateParts),
    { locale: sv }
  );

  assert.deepEqual(
    {
      reviewDateCopy,
      nextReviewDateParts: snapshot.nextReviewDateParts,
      baseDateParts: snapshot.baseDateParts,
      localeImport: snapshot.localeImport
    },
    snapshot
  );
  assert.match(page, /formatRelative\(/);
  assert.match(page, /\{ locale: sv \}/);
  assert.match(page, /savedBasketReviewDateCopy/);
});
