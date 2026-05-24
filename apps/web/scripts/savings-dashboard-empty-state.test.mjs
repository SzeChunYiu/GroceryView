import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readSavingsDashboard() {
  return readFile(new URL('../src/app/savings-dashboard/page.tsx', import.meta.url), 'utf8');
}

describe('savings dashboard empty state', () => {
  it('keeps the verified savings drivers branch honest when no watchpoints are available', async () => {
    const source = await readSavingsDashboard();

    assert.match(source, /visibleWatchpoints\.length > 0/);
    assert.match(source, /No savings drivers yet/);
    assert.match(source, /PiggyBank/);
    assert.match(source, /Browse verified products/);
    assert.match(source, /href="\/products"/);
    assert.doesNotMatch(source, /console\./);
    assert.doesNotMatch(source, /fallback/i);
  });
});
