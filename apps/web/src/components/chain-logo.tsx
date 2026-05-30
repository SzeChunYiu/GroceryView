const chainLogoBySlug: Record<string, { alt: string; src: string }> = {
  citygross: { alt: 'City Gross logo', src: '/logos/city-gross.svg' },
  coop: { alt: 'Coop logo', src: '/logos/coop.svg' },
  hemkop: { alt: 'Hemköp logo', src: '/logos/hemkop.svg' },
  ica: { alt: 'ICA logo', src: '/logos/ica.svg' },
  lidl: { alt: 'Lidl logo', src: '/logos/lidl.svg' },
  netto: { alt: 'Netto logo', src: '/logos/netto.svg' },
  willys: { alt: 'Willys logo', src: '/logos/willys.svg' }
};

export function chainLogoSlug(value: string) {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('sv-SE')
    .replace(/[^a-z0-9]+/g, '');
  if (normalized.includes('hemkop')) return 'hemkop';
  if (normalized.includes('willys')) return 'willys';
  if (normalized.includes('citygross')) return 'citygross';
  if (normalized.includes('coop')) return 'coop';
  if (normalized.includes('lidl')) return 'lidl';
  if (normalized.includes('netto')) return 'netto';
  if (normalized.includes('ica')) return 'ica';
  return normalized;
}

export function ChainLogo({ chain, className = '' }: Readonly<{ chain: string; className?: string }>) {
  const logo = chainLogoBySlug[chainLogoSlug(chain)];
  if (!logo) return null;

  return <img alt={logo.alt} className={`h-6 w-auto rounded-md ${className}`} height={24} loading="lazy" src={logo.src} width={60} />;
}
