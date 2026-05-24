import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  flattenSwedishGroceryCategories,
  seedSwedishGroceryCategories,
  swedishGroceryCategoryTree
} from '../seed/categories.js';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../../../..');
const prismaSchema = readFileSync(join(repoRoot, 'prisma/schema.prisma'), 'utf8');
const rootPackage = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
  scripts?: Record<string, string>;
  prisma?: { schema?: string; seed?: string };
};

describe('Swedish grocery category seed', () => {
  it('defines a full two-level Swedish category tree with stable slugs', () => {
    assert.ok(swedishGroceryCategoryTree.length >= 14);

    const parentNames = swedishGroceryCategoryTree.map((node) => node.name);
    for (const expected of ['Mejeri', 'Kött & Chark', 'Frukt & Grönt', 'Skafferi', 'Hushåll']) {
      assert.ok(parentNames.includes(expected), `${expected} parent category missing`);
    }

    const rows = flattenSwedishGroceryCategories();
    assert.ok(rows.length >= 70, 'expected a full two-level grocery taxonomy');
    assert.equal(rows.some((row) => row.name === 'Mjölk' && row.slug === 'mjolk' && row.parentId === 'mejeri'), true);
    assert.equal(rows.some((row) => row.name === 'Färs' && row.slug === 'fars' && row.parentId === 'kott-chark'), true);
    assert.equal(rows.some((row) => row.name === 'Frukt' && row.slug === 'frukt' && row.parentId === 'frukt-gront'), true);

    const ids = new Set<string>();
    const slugs = new Set<string>();
    for (const row of rows) {
      assert.match(row.slug, /^[a-z0-9][a-z0-9-]*$/);
      assert.equal(ids.has(row.id), false, `duplicate category id ${row.id}`);
      assert.equal(slugs.has(row.slug), false, `duplicate category slug ${row.slug}`);
      ids.add(row.id);
      slugs.add(row.slug);
      if (row.parentId !== null) assert.equal(ids.has(row.parentId), true, `parent ${row.parentId} must precede ${row.id}`);
    }
  });

  it('upserts parents before child categories for Prisma db seed runs', async () => {
    const calls: Array<{ where: { id: string }; create: { parentId: string | null; slug: string; name: string } }> = [];
    const prisma = {
      category: {
        upsert: async (args: { where: { id: string }; create: { parentId: string | null; slug: string; name: string } }) => {
          calls.push(args);
          return args.create;
        }
      }
    };

    const result = await seedSwedishGroceryCategories(prisma);
    const mejeriIndex = calls.findIndex((call) => call.where.id === 'mejeri');
    const milkIndex = calls.findIndex((call) => call.where.id === 'mejeri/mjolk');

    assert.equal(result.insertedOrUpdated, flattenSwedishGroceryCategories().length);
    assert.ok(mejeriIndex >= 0);
    assert.ok(milkIndex > mejeriIndex);
    assert.equal(calls[milkIndex]?.create.parentId, 'mejeri');
    assert.equal(calls[milkIndex]?.create.slug, 'mjolk');
  });

  it('documents the Prisma categories model and exposes an npm seed command', () => {
    assert.match(prismaSchema, /model Category \{/);
    assert.match(prismaSchema, /slug\s+String\s+@unique/);
    assert.match(prismaSchema, /parentId\s+String\?\s+@map\("parent_id"\)/);
    assert.match(prismaSchema, /@@map\("categories"\)/);

    assert.equal(rootPackage.prisma?.schema, 'prisma/schema.prisma');
    assert.equal(rootPackage.prisma?.seed, 'npm run db:seed:categories');
    assert.equal(rootPackage.scripts?.['db:seed:categories'], 'npm run build -w @groceryview/db && node packages/db/dist/seed/categories.js');
  });
});
