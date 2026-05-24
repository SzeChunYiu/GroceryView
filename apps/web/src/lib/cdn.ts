export const PRODUCT_THUMBNAIL_CACHE_CONTROL = 'public, max-age=31536000, s-maxage=31536000, immutable';
export const PRODUCT_THUMBNAIL_QUALITY = 72;

const AXFOOD_IMAGE_HOST = 'assets.axfood.se';

export type ProductImageCdnHints = {
  src: string;
  quality: number;
  sizes: string;
  cacheControl: string;
};

export function productThumbnailSizes(width: number) {
  if (width <= 64) return '64px';
  if (width <= 80) return '80px';
  if (width <= 128) return '(min-width: 1280px) 18vw, (min-width: 768px) 34vw, 80vw';
  return '(min-width: 1280px) 16vw, (min-width: 768px) 33vw, 80vw';
}

export function productThumbnailHeaders() {
  return {
    'Cache-Control': PRODUCT_THUMBNAIL_CACHE_CONTROL,
    Vary: 'Accept'
  } as const;
}

export function productImageCdnSrc(src: string, width: number, quality = PRODUCT_THUMBNAIL_QUALITY) {
  try {
    const url = new URL(src);
    if (url.hostname === AXFOOD_IMAGE_HOST) {
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(quality));
      url.searchParams.set('auto', 'compress');
      url.searchParams.set('fm', 'webp');
      return url.toString();
    }
  } catch {
    return src;
  }
  return src;
}

export function productImageCdnHints({ src, width, quality = PRODUCT_THUMBNAIL_QUALITY, sizes }: { src: string; width: number; quality?: number; sizes?: string }): ProductImageCdnHints {
  return {
    src: productImageCdnSrc(src, width, quality),
    quality,
    sizes: sizes ?? productThumbnailSizes(width),
    cacheControl: PRODUCT_THUMBNAIL_CACHE_CONTROL
  };
}
