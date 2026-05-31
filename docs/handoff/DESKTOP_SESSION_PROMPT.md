# Desktop Claude Code — finish the GroceryView homepage art (fully automated, no AI credits)

**Paste the prompt in the box below into Desktop Claude Code, opened in folder `/Users/billy/GroceryView`. That's it — it does everything itself: sources free art, recolors it, wires it in, screenshots variants, lets you pick, finalizes, and pushes.**

(Open `/Users/billy/GroceryView` — NOT `grocery-map-build`, that's a stale checkout.)

---

## PROMPT — copy everything below this line

You are finishing the homepage redesign for the GroceryView Next.js app. Automate the WHOLE thing end to end — source the art yourself, integrate it, verify it, and only stop to let me pick between rendered options. Do NOT ask me to find art or design anything; I have no AI credits, so use FREE pre-made open-license assets, not AI generation.

### Environment (hard facts)
- Repo: `/Users/billy/GroceryView`. npm workspaces monorepo — use `npm`, NOT pnpm (pnpm/corepack are not installed). `node` is the Codex.app bundled binary, already on PATH. Deps already installed.
- You are on branch `feat/figma-homepage` (cut from current origin/main, has all features). PR #3808 is open against main. DO NOT switch/rebase/merge branches. Additive work only — never break the working homepage.
- Push: `cd /Users/billy/GroceryView && GH_TOKEN=$(gh auth token -u SzeChunYiu) git push origin feat/figma-homepage`. ALWAYS the SzeChunYiu account (run `gh auth switch -u SzeChunYiu` first). NEVER Babbloo.
- Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Never skip hooks.
- Dev server: `cd apps/web && npm run dev` → http://localhost:3000 (Next 16, Turbopack; compiles route on first request).

### Read first
- `docs/handoff/DESIGN_SPEC_three-style-blend.md` — the design brief.
- Existing scaffold (build on it, don't redo): `apps/web/src/components/home/search-first-home.tsx` and `apps/web/src/components/home/geometric-hero-art.tsx` (currently a CSS-gradient PLACEHOLDER). The homepage is already search-first with a real ticker + reused sections, HTTP 200. Your job is to replace the placeholder with real, designed art and polish the hero.
- Design tokens already exist in `apps/web/src/app/globals.css`: core `--gv-*` palette + a `.gv-art`-scoped art palette `--art-burgundy/forest/lime/purple/yellow`. Recolor all art to these tokens.

### The style target
Geometric / editorial "data-collage" on warm-cream paper. Scandinavian calm + a Bloomberg-terminal hint: offset rectangles, thin rule lines, a sparkline/price-chart motif, concentric arcs, small data ticks. Accents from the `--art-*` tokens used SPARINGLY (neon-lime = one tiny pop only). Decorative only, must not compete with the search field, must sit behind/right of it.

### Source the art yourself — FREE, open-license only (no AI, no credits)
Fetch real assets via direct URLs with WebFetch/curl into `apps/web/public/art/`. Prefer these, in order:
1. **Hero Patterns** (heropatterns.com) — free CC0 geometric SVG patterns (e.g. "Graph Paper", "Diagonal Lines", "Hexagons", "Circuit Board"). Inline the SVG, recolor to `--art-*`. Great for a subtle textured backdrop.
2. **SVGBackgrounds.com / Haikei-style** generated geometric SVGs (low-poly, blob, stacked-waves) if downloadable as static SVG.
3. **unDraw** (undraw.co) — open-license editorial SVG illustrations; pick a data/finance/shopping/chart-themed one, recolor via its single-color theme to terracotta.
4. **Tabler Icons / Lucide** (CC/ISC) — for sparkline, candlestick, trending-up, grid-dot motifs to compose the collage.
Verify each asset's license is CC0/MIT/open and attribution-free (or add attribution to a `apps/web/public/art/CREDITS.md` if required). If a URL fails, fall back to the next source or hand-compose a tasteful collage from the icon primitives above — but prefer real downloaded assets.

### Build it — produce 2-3 distinct hero variants
Compose 2 or 3 genuinely different hero-art treatments (e.g. A = subtle Hero-Patterns texture backdrop; B = an unDraw editorial illustration offset right; C = a layered geometric collage from icon primitives + sparkline). Each:
- Lives in/!under `geometric-hero-art.tsx` (a `variant` prop is fine), inside the `.gv-art` wrapper, `aria-hidden`, `pointer-events:none`, respects `prefers-reduced-motion`.
- Recolored ONLY with `--art-*` tokens. Cards/tables/forms/CTAs stay calm + WCAG AA — art tokens must not leak onto them.

### Verify EACH variant (mandatory — no claims without proof)
For each variant: start dev server, `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` must be 200, then headless-Chrome screenshot to `/tmp/gv-variant-{A,B,C}.png`:
`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=12000 --screenshot=/tmp/gv-variant-A.png --window-size=1440,2200 http://localhost:3000/`
Read each PNG and confirm it actually looks polished. Fix all compile/TS errors (`npx tsc --noEmit`).

### STOP and let me choose
Show me the 2-3 screenshots and a one-line description of each. Ask which variant I want (this is the ONLY thing you ask me). Then:

### Finalize
- Set the chosen variant as the hero, delete the others' dead code/assets.
- Update any homepage literal-string contract tests in `apps/web/scripts/*.test.mjs` + `design-tokens.test.mjs` (update assertions to match new content; don't delete or weaken tests).
- Final verify: 200 + screenshot + `npx tsc --noEmit` clean.
- Commit in logical chunks, push to `feat/figma-homepage`, stop the dev server (`lsof -ti:3000 | xargs kill`).
- Report honestly: what shipped, the screenshot paths, test pass/fail, asset sources + licenses, anything imperfect.

Hold a high design bar. Only report success for what you verified with a 200 + a screenshot you actually looked at. If something can't be done cleanly, say so plainly rather than faking it.

---

## After this lands
Phase 2b (separate PR, later): Bloomberg-dense Market page — move the "Nordic price index" chart hero there; add price-index board, heatmaps, sector breakdown, watchlist, multi-series charts; empty-state/404 art.
