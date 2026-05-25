import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { describe, it } from 'node:test';

async function readSearchBar() {
  return readFile(new URL('./SearchBar.tsx', import.meta.url), 'utf8');
}

describe('SearchBar keyboard autocomplete contract', () => {
  it('keeps focus on the combobox while exposing active descendant options', async () => {
    const source = await readSearchBar();

    assert.match(source, /aria-activedescendant=\{activeDescendantId\}/);
    assert.match(source, /id=\{`\$\{listboxId\}-option-\$\{index\}`\}/);
    assert.match(source, /aria-selected=\{activeOptionIndex === index\}/);
  });

  it('supports arrow navigation, Enter selection, and Escape dismissal', async () => {
    const source = await readSearchBar();

    assert.match(source, /event\.key !== 'Enter'/);
    assert.match(source, /window\.location\.assign\(activeOption\.href\)/);
    assert.match(source, /event\.key === 'Escape'/);
    assert.doesNotMatch(source, /option\?\.focus\(\)/);
  });
});
