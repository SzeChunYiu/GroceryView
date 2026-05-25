import type { ImgHTMLAttributes } from 'react';

const chainLogoMap = {
  ica: { src: '/logos/ica.svg', label: 'ICA' },
  coop: { src: '/logos/coop.svg', label: 'Coop' },
  willys: { src: '/logos/willys.svg', label: 'Willys' },
  hemkop: { src: '/logos/hemkop.svg', label: 'Hemköp' },
  hemköp: { src: '/logos/hemkop.svg', label: 'Hemköp' },
  netto: { src: '/logos/netto.svg', label: 'Netto' },
  lidl: { src: '/logos/lidl.svg', label: 'Lidl' }
} as const;

export type ChainLogoSlug = keyof typeof chainLogoMap;

export function normalizeChainLogoSlug(chain: string): ChainLogoSlug | null {
  const normalized = chain.trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (normalized in chainLogoMap) return normalized as ChainLogoSlug;
  return null;
}

export type ChainLogoProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  chain: string;
  alt?: string;
};

export function ChainLogo({ chain, alt, className = 'h-7 w-auto', ...props }: ChainLogoProps) {
  const slug = normalizeChainLogoSlug(chain);
  if (!slug) return null;
  const logo = chainLogoMap[slug];

  return (
    <img
      alt={alt ?? `${logo.label} logo`}
      className={className}
      height={32}
      loading="lazy"
      src={logo.src}
      width={80}
      {...props}
    />
  );
}
