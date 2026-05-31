import { DataCollageSvg } from './data-collage-svg';
import { BRAND_ART_COLORS } from './brand-art-tokens';

/** Thin market header accent — decorative only, not inside charts or tables. */
export function BrandArtMarketAccent() {
  return (
    <div
      aria-hidden
      className="relative mb-4 h-14 overflow-hidden rounded-2xl border-2 shadow-sm"
      data-brand-art="market-accent"
      style={{ borderColor: BRAND_ART_COLORS.purpleFrame, backgroundColor: BRAND_ART_COLORS.burgundyDeep }}
    >
      <DataCollageSvg className="h-full w-full opacity-70" variant="market-accent" />
      <p className="sr-only">Decorative market data collage accent</p>
    </div>
  );
}
