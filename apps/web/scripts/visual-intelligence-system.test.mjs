import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const visualComponentSource = () => readFileSync(new URL("../src/components/mvp/visual-intelligence.tsx", import.meta.url), "utf8");
const marketSource = () => readFileSync(new URL("../src/app/market/page.tsx", import.meta.url), "utf8");
const homeSource = () => readFileSync(new URL("../src/components/mvp/mvp-home-page.tsx", import.meta.url), "utf8");

test("visual intelligence component system exports the required reusable primitives", () => {
  const source = visualComponentSource();
  for (const component of [
    "ChartShell",
    "KpiCard",
    "Sparkline",
    "MultiLineChart",
    "HeatmapMatrix",
    "GeoHeatmap",
    "DistributionBand",
    "PriceHistoryChart",
    "ChartTooltip",
    "ChartTableFallback",
    "ChartEmptyState"
  ]) {
    assert.match(source, new RegExp(`export function ${component}\\b`), `${component} must be exported`);
  }
});

test("chart shells encode question summary evidence action fallback and empty state requirements", () => {
  const source = visualComponentSource();
  for (const required of [
    "userQuestion",
    "insightTitle",
    "plainSummary",
    "evidenceItems",
    "actionHref",
    "ChartTableFallback",
    "ChartEmptyState",
    "aria-label",
    "Color is not the only signal"
  ]) {
    assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")), `missing ${required}`);
  }
});

test("market and home pages consume reusable visual primitives instead of one-off chart cards", () => {
  const market = marketSource();
  const home = homeSource();
  for (const required of ["ChartShell", "MultiLineChart", "HeatmapMatrix", "ChartTableFallback", "ChartEmptyState"]) {
    assert.match(market, new RegExp(required), `market page should use ${required}`);
  }
  assert.match(home, /KpiCard/, "home metrics should use reusable KPI cards");
});
