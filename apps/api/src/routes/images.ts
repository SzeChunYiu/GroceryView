import { BadRequestException, Controller, Get, Query, Res } from '@nestjs/common';
import type { Response } from 'express';

const MAX_DIMENSION = 1400;
const MAX_QUALITY = 95;
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;
const ALLOWED_HOSTS = new Set([
  'images.openfoodfacts.org',
  'images.openproductsfacts.org',
  'images.mathem.se',
  'assets.icanet.se',
  'assets.axfood.se',
  'res.cloudinary.com'
]);

type ImageFormat = 'avif' | 'jpeg' | 'png' | 'webp' | 'auto';

type ImageProxyQuery = {
  url: string;
  w?: string;
  h?: string;
  q?: string;
  f?: ImageFormat;
};

function parseImageQueryValue(value: string | undefined, min = 16, max = MAX_DIMENSION): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < min || parsed > max) return undefined;
  return parsed;
}

function parseImageQuality(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < 1 || parsed > MAX_QUALITY) return undefined;
  return parsed;
}

function parseImageSourceUrl(rawUrl: string): URL {
  try {
    const sourceUrl = new URL(rawUrl);
    if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
      throw new Error('only-http');
    }
    if (!ALLOWED_HOSTS.has(sourceUrl.hostname)) {
      throw new Error('host-blocked');
    }
    return sourceUrl;
  } catch {
    throw new BadRequestException('Invalid or unsupported image URL');
  }
}

function buildUpstreamUrl(
  url: URL,
  width?: number,
  height?: number,
  quality?: number,
  format?: ImageFormat
) {
  const upstream = new URL(url);
  // Forward safe hints to providers that support simple image query overrides.
  if (width) upstream.searchParams.set('w', String(width));
  if (height) upstream.searchParams.set('h', String(height));
  if (quality) upstream.searchParams.set('q', String(quality));
  if (format) upstream.searchParams.set('f', format);
  return upstream.toString();
}

@Controller('images')
export class ImageProxyController {
  @Get()
  async get(@Query() query: ImageProxyQuery, @Res() response: Response): Promise<void> {
    if (!query.url) throw new BadRequestException('Missing required image URL');

    const sourceUrl = parseImageSourceUrl(query.url);
    const width = parseImageQueryValue(query.w, 32, MAX_DIMENSION);
    const height = parseImageQueryValue(query.h, 32, MAX_DIMENSION);
    const quality = parseImageQuality(query.q);
    const format = query.f && ['avif', 'jpeg', 'png', 'webp', 'auto'].includes(query.f) ? query.f : undefined;

    const upstreamUrl = buildUpstreamUrl(sourceUrl, width, height, quality, format);
    const upstreamResponse = await fetch(upstreamUrl);
    if (!upstreamResponse.ok) {
      throw new BadRequestException(`Could not fetch image from source (${upstreamResponse.statusText})`);
    }

    const contentType = upstreamResponse.headers.get('content-type') ?? '';
    if (!contentType.startsWith('image/')) {
      throw new BadRequestException('Upstream response was not an image');
    }

    const body = await upstreamResponse.arrayBuffer();

    response.setHeader('Content-Type', contentType);
    response.setHeader('Cache-Control', `public, max-age=${DEFAULT_TTL_SECONDS}, immutable`);
    response.setHeader('ETag', `W/"${Buffer.from(sourceUrl.href).toString('base64url')}"`);
    response.send(Buffer.from(body));
  }
}
