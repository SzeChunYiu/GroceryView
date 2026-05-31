/** Geometric data-collage palette — decorative surfaces only (not product/price UI). */
export const BRAND_ART_COLORS = {
  burgundy: '#5A1830',
  burgundyDeep: '#3D0F20',
  forest: '#1F4D3A',
  forestLight: '#2A6B52',
  neonLime: '#C8FF3D',
  purpleFrame: '#7B4DFF',
  signalYellow: '#FFE566'
} as const;

export type BrandArtVariant = 'hero' | 'empty' | 'market-accent';
