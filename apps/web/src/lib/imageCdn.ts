export type ImageCdnFormat = 'avif' | 'jpeg' | 'png' | 'webp' | 'auto';

export type ProductImageOptions = {
  width?: number;
  height?: number;
  quality?: number;
  format?: ImageCdnFormat;
  fallbackImage?: string;
};

const IMAGE_PROXY_PATH = process.env.NEXT_PUBLIC_IMAGE_PROXY ?? '/images';
const DEFAULT_FALLBACK_IMAGE = 'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="100%" height="100%" fill="#f2f7f3"/>
      <text x="50%" y="50%" text-anchor="middle" fill="#7c8f85" font-family="Arial, sans-serif" font-size="20">
        GroceryView Product
      </text>
    </svg>`
  );

function clampNumber(value: number | undefined, min: number, max: number): number | undefined {
  if (!value || Number.isNaN(value)) return undefined;
  if (value < min || value > max) return undefined;
  return value;
}

function sanitizeImageUrl(rawImageUrl: string | undefined): string | null {
  if (!rawImageUrl || typeof rawImageUrl !== 'string') return null;
  const trimmed = rawImageUrl.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }
  return null;
}

export function toImageProxyUrl(imageUrl: string | undefined, options: ProductImageOptions = {}): string {
  const sanitized = sanitizeImageUrl(imageUrl);
  if (!sanitized) return options.fallbackImage ?? DEFAULT_FALLBACK_IMAGE;

  const width = clampNumber(options.width, 16, 1600);
  const height = clampNumber(options.height, 16, 1600);
  const quality = clampNumber(options.quality, 1, 100);
  const params = new URLSearchParams();
  params.set('url', sanitized);
  if (width !== undefined) params.set('w', String(width));
  if (height !== undefined) params.set('h', String(height));
  if (quality !== undefined) params.set('q', String(quality));
  if (options.format) params.set('f', options.format);

  return `${IMAGE_PROXY_PATH}?${params.toString()}`;
}
