import type { ReactNode } from 'react';
import { DataCollageSvg } from './data-collage-svg';
import { BRAND_ART_COLORS } from './brand-art-tokens';

type BrandArtHeroShellProps = Readonly<{
  children: ReactNode;
  className?: string;
}>;

/** Hero-only burgundy collage backdrop; keeps inner content on neutral cards (not product/price UI). */
export function BrandArtHeroShell({ children, className }: BrandArtHeroShellProps) {
  return (
    <section
      className={['relative overflow-hidden rounded-[2rem] shadow-md', className].filter(Boolean).join(' ')}
      data-brand-art="hero"
      style={{ backgroundColor: BRAND_ART_COLORS.burgundy }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <DataCollageSvg className="h-full w-full object-cover opacity-90" variant="hero" />
      </div>
      <div className="relative z-10 p-1">{children}</div>
    </section>
  );
}
