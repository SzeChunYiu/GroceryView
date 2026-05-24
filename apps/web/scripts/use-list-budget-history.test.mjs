import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function readUseListHook() {
  return readFile(new URL('../src/hooks/useList.ts', import.meta.url), 'utf8');
}

describe('useList budget history auto-save source coverage', () => {
  it('keeps a stable budgetSnapshotSignature helper for duplicate checks', async () => {
    const hook = await readUseListHook();

    assert.match(hook, /export function budgetSnapshotSignature/);
    assert.match(hook, /snapshot\.total/);
    assert.match(hook, /snapshot\.checkedCount/);
    assert.match(hook, /snapshot\.totalCount/);
    assert.match(hook, /snapshot\.remainingCount/);
  });

  it('debounces budget history auto-save and clears pending saves', async () => {
    const hook = await readUseListHook();

    assert.match(hook, /BUDGET_HISTORY_SAVE_DELAY_MS/);
    assert.match(hook, /window\.setTimeout\(\(\) => \{/);
    assert.match(hook, /persistBudgetSnapshot\(\{/);
    assert.match(hook, /window\.clearTimeout\(timeoutId\)/);
  });

  it('suppresses duplicate budget snapshots when the total is unchanged', async () => {
    const hook = await readUseListHook();

    assert.match(hook, /appendBudgetSnapshotIfChanged/);
    assert.match(hook, /budgetSnapshotSignature\(lastSnapshot\) === budgetSnapshotSignature\(nextSnapshot\)/);
    assert.match(hook, /lastSnapshot\.total === nextSnapshot\.total/);
    assert.match(hook, /return history/);
  });
});
