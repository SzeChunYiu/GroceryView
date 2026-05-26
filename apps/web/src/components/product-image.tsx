import Image from 'next/image';
import { productImageCdnUrl } from '@/lib/imageCdn';

export const groceryImageBlurDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB4Mj0iMSIgeTE9IjAiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjZWNlZmYzIi8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjZGNmY2U3Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3QgZmlsbD0idXJsKCNnKSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE2IiByeD0iNCIvPjwvc3ZnPg==';

type ProductImageProps = Readonly<{
  alt: string;
  className?: string;
  height?: number;
  sizes?: string;
  src: string;
  width?: number;
}>;

export function ProductImage({ alt, className = 'h-full w-full object-contain', height = 160, sizes = '(min-width: 768px) 20vw, 50vw', src, width = 160 }: ProductImageProps) {
  return (
    <Image
      alt={alt}
      blurDataURL={groceryImageBlurDataUrl}
      className={className}
      height={height}
      loading="lazy"
      placeholder="blur"
      sizes={sizes}
      src={productImageCdnUrl(src, { width })}
      width={width}
    />
  );
}
