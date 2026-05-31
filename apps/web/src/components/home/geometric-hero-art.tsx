/**
 * GeometricHeroArt — "Terminal Compass" hero art.
 *
 * Geometric / editorial data-collage: concentric partial arcs (Bloomberg radar
 * feel) anchored right, with a micro column chart below and thin full-width
 * horizontal rules. Composition is right-weighted so it never competes with
 * the left-side search field.
 *
 * Design rules:
 *   - aria-hidden, pointer-events:none (purely decorative)
 *   - Colors exclusively from --art-* tokens (scoped to .gv-art parent)
 *   - Respects prefers-reduced-motion (no animation)
 *   - All inline SVG — CC0, no attribution required
 */
export function GeometricHeroArt() {
  // Column chart bar heights (0–1 scale). Heights > 0.8 get the forest accent.
  const bars = [0.45, 0.72, 0.58, 0.88, 0.63, 0.79, 0.51, 0.92, 0.67, 0.84];
  const barW = 14;
  const barGap = 5;
  const barBaseX = 700;
  const barBaseY = 230;
  const barMaxH = 80;

  return (
    <div
      className="gv-art pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 280"
        preserveAspectRatio="xMaxYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Left-to-right fade masks art so it dissolves toward the search field */}
          <linearGradient id="gv-hero-fade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="35%" stopColor="white" stopOpacity="0.6" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id="gv-hero-mask">
            <rect x="0" y="0" width="1000" height="280" fill="url(#gv-hero-fade)" />
          </mask>
        </defs>

        <g mask="url(#gv-hero-mask)">
          {/* Thin horizontal rules — full width, very muted */}
          {[56, 112, 168, 224].map((y) => (
            <line
              key={y}
              x1="0" y1={y} x2="1000" y2={y}
              stroke="var(--art-purple)" strokeWidth="0.5" opacity="0.18"
            />
          ))}

          {/*
            Concentric partial arcs centred at (960, 140) — Bloomberg radar.
            Pre-computed endpoints for each arc (start 160°→end 340°).
            Formula: x = cx + r·cos(deg), y = cy + r·sin(deg)
          */}
          {/* r=90 */}
          <path d="M 875.6,191.4 A 90,90 0 0,1 910.8,58.0"
            fill="none" stroke="var(--art-purple)" strokeWidth="1" opacity="0.47" />
          {/* r=140 */}
          <path d="M 827.2,218.3 A 140,140 0 0,1 951.8,-0.3"
            fill="none" stroke="var(--art-burgundy)" strokeWidth="1" opacity="0.38" />
          {/* r=190 */}
          <path d="M 778.8,245.2 A 190,190 0 0,1 992.8,-58.5"
            fill="none" stroke="var(--art-purple)" strokeWidth="1" opacity="0.29" />
          {/* r=250 — dashed */}
          <path d="M 717.9,279.8 A 250,250 0 0,1 969.2,-130.5"
            fill="none" stroke="var(--art-burgundy)" strokeWidth="1" opacity="0.21"
            strokeDasharray="4 6" />
          {/* r=315 — hairline */}
          <path d="M 645.5,321.4 A 315,315 0 0,1 944.6,-211.8"
            fill="none" stroke="var(--art-purple)" strokeWidth="0.6" opacity="0.13" />

          {/* Cross-hair at arc centre */}
          <line x1="940" y1="128" x2="940" y2="152"
            stroke="var(--art-purple)" strokeWidth="1" opacity="0.5" />
          <line x1="928" y1="140" x2="952" y2="140"
            stroke="var(--art-purple)" strokeWidth="1" opacity="0.5" />

          {/* Micro column chart */}
          {bars.map((h, i) => (
            <rect
              key={i}
              x={barBaseX + i * (barW + barGap)}
              y={barBaseY - h * barMaxH}
              width={barW}
              height={h * barMaxH}
              rx="2"
              fill={h > 0.8 ? 'var(--art-forest)' : 'var(--art-purple)'}
              opacity={h > 0.8 ? 0.65 : 0.38}
            />
          ))}

          {/* Chart baseline */}
          <line
            x1={barBaseX - 4} y1={barBaseY + 1}
            x2={barBaseX + bars.length * (barW + barGap) + 4} y2={barBaseY + 1}
            stroke="var(--art-purple)" strokeWidth="0.8" opacity="0.5"
          />

          {/* Axis ticks below chart */}
          {bars.map((_, i) => (
            <line
              key={i}
              x1={barBaseX + i * (barW + barGap) + barW / 2} y1={barBaseY + 1}
              x2={barBaseX + i * (barW + barGap) + barW / 2} y2={barBaseY + 6}
              stroke="var(--art-purple)" strokeWidth="0.7" opacity="0.4"
            />
          ))}

          {/* Vertical separator left of chart */}
          <line x1="692" y1="130" x2="692" y2="240"
            stroke="var(--art-burgundy)" strokeWidth="0.7" opacity="0.3" />

          {/* Decorative label stub above chart */}
          <rect x="700" y="110" width="58" height="14" rx="2"
            fill="none" stroke="var(--art-forest)" strokeWidth="0.8" opacity="0.4" />
          <rect x="706" y="113" width="38" height="2" rx="1"
            fill="var(--art-forest)" opacity="0.3" />
          <rect x="706" y="117" width="24" height="2" rx="1"
            fill="var(--art-forest)" opacity="0.2" />
        </g>
      </svg>
    </div>
  );
}
