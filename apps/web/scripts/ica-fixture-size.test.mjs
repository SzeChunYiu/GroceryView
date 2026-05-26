import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const repoRoot = new URL('../../../', import.meta.url);
const ingestedDir = new URL('apps/web/src/lib/ingested/', repoRoot);
const icaFile = new URL('ica.ts', ingestedDir);
const chunkDir = new URL('ica-products/', ingestedDir);
const generatorFile = new URL('scripts/ingestion/generate-live-retailer-ingested.mjs', repoRoot);
const verifierFile = new URL('scripts/ingestion/verify-ingested-provenance.mjs', repoRoot);

const mainFileLimitBytes = 1_000_000;
const chunkFileLimitBytes = 10_000_000;

describe('ICA generated fixture size bounds', () => {
  it('keeps the public ICA module small and moves product rows into bounded chunks', async () => {
    const [mainStats, mainSource, chunkNames] = await Promise.all([
      stat(icaFile),
      readFile(icaFile, 'utf8'),
      readdir(chunkDir)
    ]);
    const chunks = chunkNames.filter((name) => /^chunk-\d{3}\.ts$/.test(name)).sort();

    assert.ok(mainStats.size < mainFileLimitBytes, `ica.ts is ${mainStats.size} bytes`);
    assert.ok(chunks.length > 1, 'expected ICA rows to be split across multiple chunk files');
    assert.match(mainSource, /export const icaSources = \[/);
    assert.match(mainSource, /import \{ icaProductsChunk000 \} from '\.\/ica-products\/chunk-000';/);
    assert.match(mainSource, /export const icaProducts: IcaIngestedProduct\[] = \[/);

    for (const chunk of chunks) {
      const chunkPath = join(chunkDir.pathname, chunk);
      const [chunkStats, chunkSource] = await Promise.all([
        stat(chunkPath),
        readFile(chunkPath, 'utf8')
      ]);
      assert.ok(chunkStats.size < chunkFileLimitBytes, `${chunk} is ${chunkStats.size} bytes`);
      assert.match(chunkSource, /AUTO-GENERATED chunk for icaProducts/);
      assert.match(chunkSource, /export const icaProductsChunk\d{3} = \[/);
    }
  });

  it('keeps future ICA generation chunked and provenance verification wired to the public exports', async () => {
    const [generator, verifier] = await Promise.all([
      readFile(generatorFile, 'utf8'),
      readFile(verifierFile, 'utf8')
    ]);

    assert.match(generator, /const ICA_PRODUCTS_CHUNK_SIZE = 5000;/);
    assert.match(generator, /fetchIcaDefaultStoreProducts/);
    assert.match(generator, /directoryName: 'ica-products'/);
    assert.match(generator, /productsChunkExport\('icaProducts', 'IcaIngestedProduct'\)/);
    assert.match(verifier, /rows: 'icaProducts'/);
    assert.match(verifier, /source: 'icaSources'/);
  });
});
