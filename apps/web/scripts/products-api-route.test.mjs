import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

async function read(relative) {
  return readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
}

async function importTypescriptModule(relative) {
  const source = await read(relative);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });
  const directory = await mkdtemp(join(dirname(fileURLToPath(import.meta.url)), '.tmp-products-api-'));
  const modulePath = join(directory, 'module.mjs');
  await writeFile(modulePath, outputText);

  try {
    return await import(pathToFileURL(modulePath).href);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

describe('products API route validation', () => {
  it('accepts one happy product search query and structures one rejected input response', async () => {
    const route = await read('src/app/api/products/route.ts');
    const validation = await importTypescriptModule('src/app/api/products/query-validation.ts');

    const happy = validation.parseProductsQueryParams({ q: '  milk  ' });
    assert.equal(happy.success, true);
    assert.equal(happy.data.q, 'milk');

    const rejected = validation.parseProductsQueryParams({ q: 42 });
    assert.equal(rejected.success, false);
    const payload = validation.productsQueryValidationError(rejected.error);
    assert.equal(payload.error, 'invalid_products_query');
    assert.ok(Array.isArray(payload.issues));
    assert.equal(payload.issues[0].path[0], 'q');

    assert.match(route, /parseProductsQueryParams\(Object\.fromEntries\(searchParams\)\)/);
    assert.match(route, /productsQueryValidationError\(parsedQuery\.error\)/);
    assert.match(route, /status: 400/);
  });
});
