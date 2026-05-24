export const chainLogoPaths = {
  ica: '/logos/ica.svg',
  coop: '/logos/coop.svg',
  willys: '/logos/willys.svg',
  hemkop: '/logos/hemkop.svg',
  netto: '/logos/netto.svg',
  lidl: '/logos/lidl.svg',
} as const;

export type ChainLogoSlug = keyof typeof chainLogoPaths;

export function normaliseChainLogoSlug(value: string): ChainLogoSlug | null {
  const slug = value.toLowerCase().replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-');
  const match = Object.keys(chainLogoPaths).find((chain) => slug.includes(chain));
  return (match as ChainLogoSlug | undefined) ?? null;
}

export function ChainLogo({ chain, className = 'h-7 w-14' }: Readonly<{ chain: string; className?: string }>) {
  const slug = normaliseChainLogoSlug(chain);
  if (!slug) return null;

  return <img alt={`${chain} logo`} className={className} height={28} src={chainLogoPaths[slug]} width={56} />;
}
