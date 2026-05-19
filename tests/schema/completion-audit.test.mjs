import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const audit = readFileSync(new URL('../../docs/status/completion-audit.md', import.meta.url), 'utf8');

describe('completion audit', () => {
  it('maps objective requirements to evidence and keeps remaining gaps explicit', () => {
    for (const phrase of [
      'Objective restatement',
      'Prompt-to-artifact checklist',
      'PR #1',
      'PR #22',
      'Not complete',
      'Remaining blocking gaps'
    ]) {
      assert.match(audit, new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }
  });
});
