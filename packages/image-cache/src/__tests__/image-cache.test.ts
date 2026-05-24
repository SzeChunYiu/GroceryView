import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  cacheAndRewriteProductImages,
  cacheProductImage,
  rewriteCachedProductImageUrls,
  type CachedProductImage
} from '../index.js';

const pngBytes = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);

async function tempPublicDir(): Promise<string> {
  return await mkdtemp(join(tmpdir(), 'grocery-image-cache-'));
}

describe('product image cache', () => {
  it('downloads product images to public images/products and returns stable public URLs', async () => {
    const publicDir = await tempPublicDir();
    const fetchedUrls: string[] = [];

    const cached = await cacheProductImage({
      productId: 'product id/å',
      imageUrl: 'https://cdn.example.test/images/apple.png?expires=soon'
    }, {
      publicDir,
      fetchImpl: async (url) => {
        fetchedUrls.push(String(url));
        return new Response(pngBytes, {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'content-length': String(pngBytes.byteLength)
          }
        });
      }
    });

    assert.equal(fetchedUrls[0], 'https://cdn.example.test/images/apple.png?expires=soon');
    assert.equal(cached.productId, 'product id/å');
    assert.equal(cached.originalUrl, 'https://cdn.example.test/images/apple.png?expires=soon');
    assert.match(cached.cachedUrl, /^\/images\/products\/product-id-[a-f0-9]{16}\.png$/);
    assert.match(cached.relativePath, /^images\/products\/product-id-[a-f0-9]{16}\.png$/);
    assert.match(cached.sha256, /^sha256:[a-f0-9]{64}$/);
    assert.equal(cached.bytes, pngBytes.byteLength);
    assert.deepEqual(await readFile(join(publicDir, cached.relativePath)), Buffer.from(pngBytes));
  });

  it('rejects unsafe sources, non-images, and oversized responses', async () => {
    const publicDir = await tempPublicDir();
    let fetchCalls = 0;
    const fetchImpl = async () => {
      fetchCalls += 1;
      return new Response(pngBytes, { status: 200, headers: { 'content-type': 'image/png' } });
    };

    for (const imageUrl of [
      'ftp://cdn.example.test/image.png',
      'http://localhost/image.png',
      'http://127.0.0.1/image.png',
      'https://user:pass@cdn.example.test/image.png'
    ]) {
      await assert.rejects(
        () => cacheProductImage({ productId: 'blocked-product', imageUrl }, { publicDir, fetchImpl }),
        /http\(s\)|private|credentials/i
      );
    }
    assert.equal(fetchCalls, 0, 'unsafe URLs should be rejected before network access');

    await assert.rejects(
      () => cacheProductImage({ productId: 'not-image', imageUrl: 'https://cdn.example.test/file.txt' }, {
        publicDir,
        fetchImpl: async () => new Response('plain text', { status: 200, headers: { 'content-type': 'text/plain' } })
      }),
      /unsupported image content type/i
    );

    await assert.rejects(
      () => cacheProductImage({ productId: 'too-large', imageUrl: 'https://cdn.example.test/huge.png' }, {
        publicDir,
        maxBytes: 4,
        fetchImpl: async () => new Response(pngBytes, {
          status: 200,
          headers: {
            'content-type': 'image/png',
            'content-length': String(pngBytes.byteLength)
          }
        })
      }),
      /exceeds maximum/i
    );
  });

  it('rewrites product image URLs in the database with parameterized updates', async () => {
    const cachedImage: CachedProductImage = {
      productId: 'product-db-1',
      originalUrl: 'https://cdn.example.test/apple.webp',
      cachedUrl: '/images/products/product-db-1-abc.webp',
      relativePath: 'images/products/product-db-1-abc.webp',
      absolutePath: '/tmp/public/images/products/product-db-1-abc.webp',
      contentType: 'image/webp',
      bytes: 5,
      sha256: 'sha256:abc'
    };
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const executor = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        calls.push({ sql, params });
        return [{ id: params[1] }] as T[];
      }
    };

    const updatedIds = await rewriteCachedProductImageUrls(executor, [cachedImage]);

    assert.deepEqual(updatedIds, ['product-db-1']);
    assert.equal(calls.length, 1);
    assert.match(calls[0]!.sql, /update products\s+set image_url = \$1/i);
    assert.match(calls[0]!.sql, /where id = \$2/i);
    assert.deepEqual(calls[0]!.params, [
      '/images/products/product-db-1-abc.webp',
      'product-db-1',
      'https://cdn.example.test/apple.webp'
    ]);
  });

  it('downloads and rewrites only products with usable external image URLs', async () => {
    const publicDir = await tempPublicDir();
    const calls: Array<{ sql: string; params: unknown[] }> = [];
    const executor = {
      async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
        calls.push({ sql, params });
        return [{ id: params[1] }] as T[];
      }
    };

    const result = await cacheAndRewriteProductImages(executor, [
      { productId: 'product-db-1', imageUrl: 'https://cdn.example.test/coffee.webp' },
      { productId: 'product-db-2', imageUrl: '' },
      { productId: 'product-db-3', imageUrl: '/images/products/already-cached.png' }
    ], {
      publicDir,
      fetchImpl: async () => new Response(pngBytes, {
        status: 200,
        headers: {
          'content-type': 'image/webp',
          'content-length': String(pngBytes.byteLength)
        }
      })
    });

    assert.equal(result.cachedImages.length, 1);
    assert.deepEqual(result.updatedProductIds, ['product-db-1']);
    assert.deepEqual(result.skippedProductIds.sort(), ['product-db-2', 'product-db-3']);
    assert.equal(calls.length, 1);
  });
});
