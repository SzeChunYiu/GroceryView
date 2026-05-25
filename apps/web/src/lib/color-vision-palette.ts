import palette from './color-vision-palette.tokens.json';

export type PriceState = keyof typeof palette.price;
export type ConfidenceState = keyof typeof palette.confidence;
export type PaletteGroup = keyof typeof palette;
export type PaletteToken = Readonly<{
  foreground: string;
  background: string;
  indicator: string;
  label: string;
  meaning: string;
}>;

export const colorVisionStateTokens = palette as Readonly<{
  price: Record<string, PaletteToken>;
  deal: Record<string, PaletteToken>;
  freshness: Record<string, PaletteToken>;
  confidence: Record<string, PaletteToken>;
}>;

export function priceStateForIndex(value: number | null | undefined): PriceState {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'unavailable';
  if (value < 96) return 'cheap';
  if (value <= 103) return 'market';
  return 'expensive';
}

export function priceStateToken(value: number | null | undefined) {
  return colorVisionStateTokens.price[priceStateForIndex(value)];
}

export function confidenceStateToken(level: ConfidenceState) {
  return colorVisionStateTokens.confidence[level];
}
