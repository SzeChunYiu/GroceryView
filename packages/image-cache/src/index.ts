import { Buffer } from 'node:buffer';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { isIP } from 'node:net';
import { join } from 'node:path';

export type ImageCacheProduct = {
  productId: string;
  imageUrl?: string | null;
};

export type CachedProductImage = {
  productId: string;
  originalUrl: string;
  cachedUrl: string;
  relativePath: string;
  absolutePath: string;
  contentType: string;
  bytes: number;
  sha256: string;
};

export type ImageCacheRewriteResult = {
  updatedProductIds: string[];
  skippedProductIds: string[];
  cachedImages: CachedProductImage[];
};

export type ImageCacheOptions = {
  /** Filesystem path to the framework public directory. Defaults to ./public for standalone use. */
  publicDir?: string;
  /** Public URL prefix to expose cached products from. Defaults to /images/products. */
  basePublicPath?: string;
  fetchImpl?: typeof fetch;
  maxBytes?: number;
  allowedContentTypes?: readonly string[];
  /** Defaults to false to prevent ingest-time SSRF against local services. */
  allowPrivateHosts?: boolean;
};

export type QueryExecutorLike = {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
};

type IdRow = { id: string };

const DEFAULT_BASE_PUBLIC_PATH = '/images/products';
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;
const DEFAULT_ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
] as const;

function normalizeBasePublicPath(value = DEFAULT_BASE_PUBLIC_PATH): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('/')) throw new Error('basePublicPath must start with /.');
  if (trimmed.includes('..')) throw new Error('basePublicPath cannot contain path traversal segments.');
  return trimmed.replace(/\/+$/g, '') || DEFAULT_BASE_PUBLIC_PATH;
}

function publicPathToRelativeDir(basePublicPath: string): string {
  return basePublicPath.replace(/^\/+/, '');
}

function sanitizeFilenamePart(value: string): string {
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'product';
}

function normalizeContentType(value: string | null): string {
  return (value ?? '').split(';', 1)[0]!.trim().toLowerCase();
}

function extensionForContentType(contentType: string): string {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  if (contentType === 'image/webp') return 'webp';
  if (contentType === 'image/gif') return 'gif';
  if (contentType === 'image/avif') return 'avif';
  return 'img';
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts as [number, number, number, number];
  return a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224;
}

function isPrivateIpv6(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return normalized === '::1' ||
    normalized === '::' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:') ||
    normalized.startsWith('::ffff:127.') ||
    normalized.startsWith('::ffff:10.') ||
    normalized.startsWith('::ffff:192.168.');
}

function isPrivateHost(hostname: string): boolean {
  const normalized = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (normalized === 'localhost' || normalized.endsWith('.localhost') || normalized.endsWith('.local')) return true;
  const ipVersion = isIP(normalized);
  if (ipVersion === 4) return isPrivateIpv4(normalized);
  if (ipVersion === 6) return isPrivateIpv6(normalized);
  return false;
}

function parseSafeImageUrl(value: string, options: Pick<ImageCacheOptions, 'allowPrivateHosts'>): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('image URL must be an absolute URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('image URL must use http(s).');
  if (url.username || url.password) throw new Error('image URL credentials are not allowed.');
  if (!options.allowPrivateHosts && isPrivateHost(url.hostname)) throw new Error('private image hosts are not allowed.');
  return url;
}

function isCacheCandidate(product: ImageCacheProduct, basePublicPath: string): boolean {
  const imageUrl = product.imageUrl?.trim();
  if (!product.productId.trim() || !imageUrl) return false;
  if (imageUrl.startsWith(`${basePublicPath}/`) || imageUrl === basePublicPath) return false;
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function maxBytesFor(options: ImageCacheOptions): number {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  if (!Number.isInteger(maxBytes) || maxBytes <= 0) throw new Error('maxBytes must be a positive integer.');
  return maxBytes;
}

export async function cacheProductImage(product: ImageCacheProduct, options: ImageCacheOptions = {}): Promise<CachedProductImage> {
  const originalUrl = product.imageUrl?.trim();
  if (!product.productId.trim()) throw new Error('productId is required to cache product images.');
  if (!originalUrl) throw new Error('imageUrl is required to cache product images.');

  const url = parseSafeImageUrl(originalUrl, options);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error('fetch implementation is required to cache product images.');
  const maxBytes = maxBytesFor(options);

  const response = await fetchImpl(url);
  if (!response.ok) throw new Error(`image download failed with HTTP ${response.status}.`);

  const contentType = normalizeContentType(response.headers.get('content-type'));
  const allowedContentTypes = options.allowedContentTypes ?? DEFAULT_ALLOWED_CONTENT_TYPES;
  if (!allowedContentTypes.includes(contentType)) throw new Error(`unsupported image content type: ${contentType || 'unknown'}.`);

  const contentLength = response.headers.get('content-length');
  if (contentLength?.trim()) {
    const parsedLength = Number(contentLength);
    if (Number.isFinite(parsedLength) && parsedLength > maxBytes) throw new Error(`image response exceeds maximum size of ${maxBytes} bytes.`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.byteLength > maxBytes) throw new Error(`image response exceeds maximum size of ${maxBytes} bytes.`);
  if (buffer.byteLength === 0) throw new Error('image response body is empty.');

  const basePublicPath = normalizeBasePublicPath(options.basePublicPath);
  const relativeDir = publicPathToRelativeDir(basePublicPath);
  const sha256Hex = createHash('sha256').update(buffer).digest('hex');
  const extension = extensionForContentType(contentType);
  const filename = `${sanitizeFilenamePart(product.productId)}-${sha256Hex.slice(0, 16)}.${extension}`;
  const relativePath = `${relativeDir}/${filename}`;
  const publicDir = options.publicDir ?? join(process.cwd(), 'public');
  const absolutePath = join(publicDir, relativePath);

  await mkdir(join(publicDir, relativeDir), { recursive: true });
  await writeFile(absolutePath, buffer);

  return {
    productId: product.productId,
    originalUrl,
    cachedUrl: `${basePublicPath}/${filename}`,
    relativePath,
    absolutePath,
    contentType,
    bytes: buffer.byteLength,
    sha256: `sha256:${sha256Hex}`
  };
}

export async function rewriteCachedProductImageUrls(
  executor: QueryExecutorLike,
  cachedImages: readonly CachedProductImage[]
): Promise<string[]> {
  const updatedProductIds: string[] = [];
  for (const cached of cachedImages) {
    const rows = await executor.query<IdRow>(
      `update products
       set image_url = $1,
           updated_at = now()
       where id = $2
         and (
           image_url is null
           or image_url = ''
           or image_url = $3
           or image_url not like '/images/products/%'
         )
       returning id`,
      [cached.cachedUrl, cached.productId, cached.originalUrl]
    );
    const updatedId = rows[0]?.id;
    if (updatedId) updatedProductIds.push(updatedId);
  }
  return updatedProductIds;
}

export async function cacheAndRewriteProductImages(
  executor: QueryExecutorLike,
  products: readonly ImageCacheProduct[],
  options: ImageCacheOptions = {}
): Promise<ImageCacheRewriteResult> {
  const basePublicPath = normalizeBasePublicPath(options.basePublicPath);
  const cachedImages: CachedProductImage[] = [];
  const skippedProductIds: string[] = [];
  const seenProductIds = new Set<string>();

  for (const product of products) {
    const productId = product.productId.trim();
    if (!productId || seenProductIds.has(productId)) {
      if (productId) skippedProductIds.push(productId);
      continue;
    }
    seenProductIds.add(productId);
    if (!isCacheCandidate(product, basePublicPath)) {
      skippedProductIds.push(productId);
      continue;
    }
    cachedImages.push(await cacheProductImage({ productId, imageUrl: product.imageUrl }, { ...options, basePublicPath }));
  }

  const updatedProductIds = await rewriteCachedProductImageUrls(executor, cachedImages);
  return {
    updatedProductIds,
    skippedProductIds,
    cachedImages
  };
}
