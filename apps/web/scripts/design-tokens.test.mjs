import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const globalsCssUrl = new URL('../src/app/globals.css', import.meta.url);

const requiredTokens = [
  '--gv-bg',
  '--gv-bg-soft',
  '--gv-surface',
  '--gv-surface-muted',
  '--gv-ink',
  '--gv-ink-soft',
  '--gv-muted',
  '--gv-primary',
  '--gv-primary-strong',
  '--gv-primary-soft',
  '--gv-accent',
  '--gv-mint',
  '--gv-success',
  '--gv-warning',
  '--gv-danger',
  '--gv-info',
  '--gv-border',
  '--gv-radius-control',
  '--gv-radius-card',
  '--gv-radius-section',
  '--gv-radius-hero',
  '--gv-space-xs',
  '--gv-space-sm',
  '--gv-space-md',
  '--gv-space-base',
  '--gv-space-lg',
  '--gv-space-xl',
  '--gv-space-2xl',
  '--gv-space-3xl',
  '--gv-space-page',
  '--gv-font-stack'
];

describe('design tokens in globals.css', () => {
  it('declares key groceryview CSS custom properties', async () => {
    const css = await readFile(globalsCssUrl, 'utf8');

    for (const token of requiredTokens) {
      assert.match(css, new RegExp(`${token}\\s*:`), `missing ${token}`);
    }

    assert.match(css, /--gv-bg:\s*#f7f3ea/i, 'oat background token should match handoff palette');
    assert.match(css, /--gv-primary:\s*#064e3b/i, 'forest primary token should match handoff palette');
    assert.match(css, /--gv-accent:\s*#bdeb4b/i, 'lime accent token should match handoff palette');
  });
});
