# Desktop Claude Code — kickoff for the Figma homepage art

**Folder to open:** `/Users/billy/GroceryView` (NOT `grocery-map-build` — that's a stale secondary checkout on an unrelated branch with no node_modules).
**Branch:** `feat/figma-homepage` (already checked out; PR #3808 open against main).
**Current state:** search-first homepage scaffold is live and pushed (real search hero + slim ticker with real data + reused calm sections). The hero art is a CSS-gradient PLACEHOLDER inside `apps/web/src/components/home/geometric-hero-art.tsx` (`.gv-art` wrapper). Everything is ready to receive real Figma art.

---

## Step A — get an art frame (you have none yet)

Easiest path = **Figma Make** (AI generates the art; no manual design needed). In figma.com → Make → New, paste:

> A geometric data-collage hero illustration for a Nordic grocery price-comparison website. Editorial, Scandinavian, Bloomberg-terminal feel on warm-cream paper (oklch 96.5% 0.012 78). Asymmetric, right-weighted composition: offset rectangles, thin rule lines, a sparkline/price-chart motif, concentric arcs, small data ticks. Accent colors used sparingly: burgundy, deep forest green, neon-lime (ONE small pop only), purple, mustard-yellow. Calm and sophisticated, not busy. Leave the left side open for a large search bar. Decorative only — no text.

Then right-click the frame → **Copy link to selection**. That URL is your frame.

(Alternatives: design it yourself in Figma; or grab a free editorial/geometric SVG from unDraw / Figma Community and skip Figma entirely.)

---

## Step B — paste this prompt into Desktop Claude Code

> **Context:** Working in `/Users/billy/GroceryView` (npm workspaces monorepo — use `npm`, NOT pnpm; `node` is the Codex.app bundled binary). I'm on branch `feat/figma-homepage` (has all features; PR #3808 open against main). Push with `GH_TOKEN=$(gh auth token -u SzeChunYiu) git push origin feat/figma-homepage` — always SzeChunYiu, NEVER Babbloo. Commit trailer: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
>
> **Read first:** `docs/handoff/DESIGN_SPEC_three-style-blend.md` (the brief). The search-first homepage scaffold already exists at `apps/web/src/components/home/search-first-home.tsx` + `geometric-hero-art.tsx` (currently a gradient placeholder). Build on it — don't redo it. See `git log --oneline origin/main..HEAD`.
>
> **Figma is the art source.** Verify the Figma MCP is live with `/mcp` (tools are `mcp__...Figma__*`). My homepage hero art frame: **[PASTE FIGMA FRAME URL HERE]**.
>
> **Do this:**
> 1. Pull that frame via the Figma MCP (`get_design_context` / `get_code` / `get_image` / `get_variable_defs`). Export raster/vector art as optimized assets into `apps/web/public/`.
> 2. Replace the placeholder in `geometric-hero-art.tsx` with the REAL Figma art, integrated faithfully (not machine-invented shapes). Keep it decorative (`aria-hidden`, `pointer-events:none`), behind/right of the search field, low enough not to compete.
> 3. Map any Figma color variables → the `--gv-*` / `--art-*` tokens already in `globals.css` (extend, don't rename). Art colors stay decorative-only; cards/tables/forms/CTAs stay calm + WCAG AA.
> 4. **Verify before claiming done:** `cd apps/web && npm run dev`; `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` must be 200; headless-Chrome screenshot and visually confirm it matches the Figma frame. Fix all compile/TS errors (`npx tsc --noEmit`). Update any homepage literal-string contract tests in `apps/web/scripts/*.test.mjs` (update assertions, don't delete tests).
> 5. Commit in logical chunks, push to `feat/figma-homepage`, report honestly what matches the frame and what doesn't.
>
> Hold a high design bar — only report success for what you verified with a 200 + a screenshot you actually looked at.

---

## Phase 2b (later, separate PR) — Bloomberg-dense Market page
Move the "Nordic price index" chart hero to the Market page; add price-index board, heatmaps, sector breakdown, watchlist, multi-series charts; empty-state/404 art. Not part of this homepage PR.
