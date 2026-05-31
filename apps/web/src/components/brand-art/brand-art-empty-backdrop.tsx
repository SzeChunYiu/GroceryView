import { DataCollageSvg } from './data-collage-svg';
import { BRAND_ART_COLORS } from './brand-art-tokens';

/** Decorative layer for fail-closed / empty panels — aria-hidden, no interaction. */
export function BrandArtEmptyBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]" data-brand-art="empty">
      <div className="absolute inset-0 opacity-30" style={{ backgroundColor: BRAND_ART_COLORS.burgundy }} />
      <DataCollageSvg className="absolute -right-8 -top-6 h-40 w-64 opacity-80" variant="empty" />
      <div
        className="absolute bottom-3 left-3 h-16 w-24 rounded-lg border-2 border-dashed opacity-70"
        style={{ borderColor: BRAND_ART_COLORS.purpleFrame }}
      />
    </div>
  );
}
