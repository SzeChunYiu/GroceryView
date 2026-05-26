export type ProductImageCdnOptions = Readonly<{
  quality?: number;
  width?: number;
}>;

export const productImageCdnRoute = '/api/images';

const passthroughSchemes = ['data:', 'blob:'];

function boundedInteger(value: number | undefined, min: number, max: number) {
  if (!Number.isFinite(value)) return null;
  return String(Math.max(min, Math.min(max, Math.round(value))));
}

function shouldBypassImageCdn(src: string) {
  if (src.startsWith('/') || passthroughSchemes.some((scheme) => src.startsWith(scheme))) return true;

  try {
    const url = new URL(src);
    return url.protocol !== 'http:' && url.protocol !== 'https:';
  } catch {
    return true;
  }
}

export function productImageCdnUrl(src: string | null | undefined, options: ProductImageCdnOptions = {}) {
  const trimmed = src?.trim();
  if (!trimmed) return '';
  if (shouldBypassImageCdn(trimmed)) return trimmed;

  const params = new URLSearchParams({ src: trimmed });
  const width = boundedInteger(options.width, 32, 1280);
  const quality = boundedInteger(options.quality, 35, 95);
  if (width) params.set('w', width);
  if (quality) params.set('q', quality);

  return `${productImageCdnRoute}?${params.toString()}`;
}
