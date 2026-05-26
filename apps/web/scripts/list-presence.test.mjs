import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

describe('collaborative list presence indicators', () => {
  it('ships a typed presence model with active, editing, viewing, and idle summaries', async () => {
    const source = await read('src/lib/list-presence.ts');

    assert.match(source, /export type ListPresenceState = 'viewing' \| 'editing' \| 'idle'/);
    assert.match(source, /activeItemId\?: string/);
    assert.match(source, /summarizeListPresence/);
    assert.match(source, /participantsForListItem/);
    assert.match(source, /listPresenceParticipants/);
  });

  it('renders list-level and item-level presence from the shopping list page into ListCard', async () => {
    const page = await read('src/app/list/page.tsx');
    const card = await read('src/components/list-card.tsx');

    assert.match(page, /listPresenceParticipants/);
    assert.match(page, /summarizeListPresence/);
    assert.match(page, /presenceParticipants=\{listPresenceParticipants\}/);
    assert.match(card, /presenceParticipants = \[\]/);
    assert.match(card, /participantsForListItem\(presenceParticipants, item\.id\)/);
    assert.match(card, /role="status"/);
    assert.match(card, /aria-label=\{`Presence on \$\{item\.name\}`\}/);
  });
});
