import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '../..');
const seedPath = join(repoRoot, 'packages/server/seeds/produceClasses.sql');
const docPath = join(repoRoot, 'docs/product-classes/produce/README.md');
const seedSql = readFileSync(seedPath, 'utf8');
const docs = readFileSync(docPath, 'utf8');

const topLevelIds = [
  'vegetable-root',
  'vegetable-leaf',
  'vegetable-fruit',
  'vegetable-cruciferous',
  'vegetable-bulb',
  'vegetable-allium',
  'fruit-pome',
  'fruit-stone',
  'fruit-berry',
  'fruit-citrus',
  'fruit-tropical',
  'herb-leaf',
  'herb-root',
  'mushroom'
];

function parseSeedRows() {
  const rowPattern = /^\s*\('([^']+)', (null|'[^']+'), '([^']+)', '([^']+)', (\d+), (\d+)\),?$/gm;
  return [...seedSql.matchAll(rowPattern)].map((match) => ({
    id: match[1],
    parentId: match[2] === 'null' ? null : match[2].slice(1, -1),
    name: match[3],
    segment: match[4],
    depth: Number(match[5]),
    sortOrder: Number(match[6])
  }));
}

describe('produce class SQL seed', () => {
  it('creates an idempotent produce class table and seed', () => {
    assert.match(seedSql, /create table if not exists produce_classes/);
    assert.match(seedSql, /insert into produce_classes/);
    assert.match(seedSql, /on conflict \(id\) do update set/);
    assert.match(seedSql, /produce_classes_parent_idx/);
  });

  it('defines the requested top-level produce classes', () => {
    const rows = parseSeedRows();
    const roots = rows.filter((row) => row.parentId === null).map((row) => row.id);

    assert.deepEqual(roots, topLevelIds);
    assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
    assert.ok(rows.length >= 80, `expected at least 80 produce classes, found ${rows.length}`);
  });

  it('keeps parent classes before child classes and validates hierarchy metadata', () => {
    const rows = parseSeedRows();
    const seen = new Set();

    for (const row of rows) {
      assert.match(row.id, /^[a-z0-9][a-z0-9/-]*[a-z0-9]$/);
      assert.ok(['vegetable', 'fruit', 'herb', 'mushroom'].includes(row.segment), `${row.id} has invalid segment`);
      assert.ok(row.depth >= 0 && row.depth <= 3, `${row.id} depth must stay bounded`);
      assert.equal(Number.isInteger(row.sortOrder), true, `${row.id} sort order must be numeric`);
      if (row.parentId === null) {
        assert.equal(row.depth, 0, `${row.id} root depth must be 0`);
      } else {
        assert.equal(seen.has(row.parentId), true, `${row.id} parent ${row.parentId} must precede child`);
      }
      seen.add(row.id);
    }
  });

  it('includes the requested apple, tomato, and potato subclasses', () => {
    const ids = new Set(parseSeedRows().map((row) => row.id));

    for (const id of [
      'fruit-pome/apple/granny-smith',
      'fruit-pome/apple/pink-lady',
      'fruit-pome/apple/royal-gala',
      'vegetable-fruit/tomato/cherry',
      'vegetable-fruit/tomato/vine',
      'vegetable-fruit/tomato/plum',
      'vegetable-fruit/tomato/beef',
      'vegetable-fruit/tomato/round',
      'vegetable-root/potato/floury/king-edward',
      'vegetable-root/potato/floury/bintje',
      'vegetable-root/potato/waxy/cara',
      'vegetable-root/potato/waxy/mandel',
      'vegetable-root/potato/waxy/charlotte',
      'vegetable-root/potato/new-potato'
    ]) {
      assert.equal(ids.has(id), true, `${id} missing from produce class seed`);
    }
  });

  it('documents the produce taxonomy path and representative branches', () => {
    assert.match(docs, /packages\/server\/seeds\/produceClasses\.sql/);
    for (const id of [...topLevelIds, 'fruit-pome/apple/granny-smith', 'vegetable-fruit/tomato/cherry', 'vegetable-root/potato/new-potato']) {
      assert.match(docs, new RegExp(id.replaceAll('/', '\\/')));
    }
  });
});
