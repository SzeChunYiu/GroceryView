/**
 * GeometricHeroArt — placeholder for Figma-imported art.
 * A subtle CSS gradient using --art-* tokens, art-scoped under .gv-art.
 * Will be replaced with actual Figma art asset in a follow-up PR.
 */
export function GeometricHeroArt() {
  return (
    <div
      className="gv-art pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Subtle right-weighted gradient bleed — placeholder until Figma art is imported */}
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 60% 80% at 95% 40%, oklch(38% 0.13 12 / 0.10) 0%, transparent 65%)',
            'radial-gradient(ellipse 40% 60% at 85% 80%, oklch(45% 0.12 152 / 0.08) 0%, transparent 55%)',
            'radial-gradient(ellipse 30% 40% at 80% 10%, oklch(48% 0.18 300 / 0.07) 0%, transparent 50%)',
          ].join(', ')
        }}
      />
    </div>
  );
}
