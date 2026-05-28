import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), "utf8");
}

test("store page uses the MVP question header and source confidence strip", async () => {
  const source = await read("src/app/stores/[slug]/page.tsx");
  assert.match(source, /PageQuestionHeader/);
  assert.match(source, /question="Is this store good for the products I need\?"/);
  assert.match(source, /SourceCitation/);
  assert.match(source, /confidenceLabel=\{`\$\{pricePercentileRank\.confidenceLabel\}/);
});

test("store product and deal actions sit near branch product coverage", async () => {
  const source = await read("src/app/stores/[slug]/page.tsx");
  assert.match(source, /Search products at this store/);
  assert.match(source, /Deals at this store/);
  assert.match(source, /href=\{`\/search\?store=\$\{encodeURIComponent\(store\.slug\)\}`\}/);
  assert.match(source, /href=\{`\/deals\?store=\$\{encodeURIComponent\(store\.slug\)\}`\}/);
});

test("branch product cards and substitution suggestions link to product pages", async () => {
  const source = await read("src/app/stores/[slug]/page.tsx");
  assert.match(source, /href=\{`\/products\/\$\{encodeURIComponent\(item\.id\)\}`\}/);
  assert.match(source, /href=\{`\/products\/\$\{encodeURIComponent\(suggestion\.slug\)\}`\}/);
});
