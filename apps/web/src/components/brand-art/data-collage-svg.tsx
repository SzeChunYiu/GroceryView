import { BRAND_ART_COLORS, type BrandArtVariant } from './brand-art-tokens';

type DataCollageSvgProps = Readonly<{
  variant?: BrandArtVariant;
  className?: string;
}>;

/** Decorative geometric collage — must stay aria-hidden and outside data-dense UI. */
export function DataCollageSvg({ variant = 'hero', className }: DataCollageSvgProps) {
  const dense = variant === 'hero';
  const opacity = variant === 'market-accent' ? 0.55 : 0.85;

  return (
    <svg
      aria-hidden
      className={className}
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      viewBox="0 0 640 360"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={BRAND_ART_COLORS.burgundyDeep} height="360" opacity={opacity} width="640" />
      <polygon fill={BRAND_ART_COLORS.forest} opacity="0.92" points="0,220 180,120 320,200 0,360" />
      <polygon fill={BRAND_ART_COLORS.forestLight} opacity="0.78" points="420,40 640,0 640,180 500,120" />
      <polygon fill={BRAND_ART_COLORS.neonLime} opacity={dense ? 0.35 : 0.22} points="260,80 420,20 520,140 340,200" />
      <rect
        fill="none"
        height={dense ? 200 : 140}
        opacity="0.9"
        stroke={BRAND_ART_COLORS.purpleFrame}
        strokeWidth={dense ? 6 : 4}
        width={dense ? 280 : 200}
        x={dense ? 300 : 380}
        y={dense ? 40 : 80}
      />
      <rect
        fill="none"
        height={dense ? 120 : 90}
        opacity="0.65"
        stroke={BRAND_ART_COLORS.purpleFrame}
        strokeDasharray="10 8"
        strokeWidth="3"
        width={dense ? 180 : 130}
        x="40"
        y={dense ? 30 : 50}
      />
      {[
        [92, 248],
        [188, 168],
        [352, 252],
        [468, 108],
        [548, 196],
        ...(dense ? ([[520, 280], [120, 96]] as const) : [])
      ].map(([cx, cy]) => (
        <circle cx={cx} cy={cy} fill={BRAND_ART_COLORS.signalYellow} key={`${cx}-${cy}`} r={dense ? 7 : 5} />
      ))}
      <path
        d="M 80 300 L 200 260 L 280 310 L 420 240 L 560 300"
        fill="none"
        opacity="0.5"
        stroke={BRAND_ART_COLORS.neonLime}
        strokeWidth="2"
      />
    </svg>
  );
}
