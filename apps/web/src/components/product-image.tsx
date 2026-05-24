'use client';

import Image, { type ImageProps } from 'next/image';
import { productImageCdnHints } from '@/lib/cdn';

type ProductImageProps = Omit<ImageProps, 'src' | 'alt' | 'width' | 'height' | 'quality' | 'sizes'> & {
  src: string;
  alt: string;
  width: number;
  height: number;
  quality?: number;
  sizes?: string;
};

export function ProductImage({ src, alt, width, height, quality, sizes, ...props }: Readonly<ProductImageProps>) {
  const hints = productImageCdnHints({ src, width, quality, sizes });

  return (
    <Image
      {...props}
      alt={alt}
      data-cache-control={hints.cacheControl}
      height={height}
      quality={hints.quality}
      sizes={hints.sizes}
      src={hints.src}
      width={width}
    />
  );
}
