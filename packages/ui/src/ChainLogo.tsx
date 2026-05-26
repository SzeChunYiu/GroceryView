export const chainLogoBySlug = {
  coop: '/logos/coop.svg',
  hemkop: '/logos/hemkop.svg',
  ica: '/logos/ica.svg',
  lidl: '/logos/lidl.svg',
  netto: '/logos/netto.svg',
  willys: '/logos/willys.svg'
} as const;

export type ChainLogoSlug = keyof typeof chainLogoBySlug;

export function chainLogoSrc(slug: ChainLogoSlug) {
  return chainLogoBySlug[slug];
}
