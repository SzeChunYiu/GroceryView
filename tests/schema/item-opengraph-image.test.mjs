import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const route = readFileSync(new URL('../../apps/web/src/app/items/[id]/opengraph-image.tsx', import.meta.url), 'utf8');

describe('item OpenGraph image route', () => {
  it('renders product images with explicit dimensions for deterministic Next OG builds', () => {
    assert.match(route, /<img\s+[^>]*src=\{model\.image\}[^>]*width=\{342\}[^>]*height=\{342\}/s);
  });
});
