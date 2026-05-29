import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const repoRoot = process.cwd();
const portfolioDir = path.join(repoRoot, "docs", "bi-portfolio");
const expectedFiles = [
  "README.md",
  "00_overview.md",
  "01_dashboard_pages.md",
  "02_kpi_definitions.md",
  "03_data_model.md",
  "04_sql_reporting_views.md",
  "05_data_quality_monitoring.md",
  "06_power_automate_reporting.md",
  "07_business_insight_report_template.md",
  "08_employer_case_study.md",
  "09_cv_project_bullets.md",
  "10_main_readme_section.md",
];

function read(relativePath) {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

test("BI portfolio zip artifacts are installed", () => {
  for (const file of expectedFiles) {
    assert.ok(existsSync(path.join(portfolioDir, file)), `${file} is missing`);
  }
});

test("root README links to the BI portfolio overview", () => {
  const readme = read("README.md");
  assert.match(readme, /BI \/ Data Analyst Portfolio Case Study/);
  assert.match(readme, /docs\/bi-portfolio\/00_overview\.md/);
});

test("portfolio docs avoid raw template placeholders", () => {
  const forbiddenPatterns = [
    /\[Insert /i,
    /\[Chain [A-D]\]/,
    /\[Product [A-D]\]/,
    /Replace placeholder/i,
    /Replace example metrics/i,
  ];

  for (const file of expectedFiles) {
    const content = read(path.join("docs", "bi-portfolio", file));
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(content, pattern, `${file} contains ${pattern}`);
    }
  }
});

test("SQL reporting views are aligned with GroceryView schema names", () => {
  const sqlDoc = read("docs/bi-portfolio/04_sql_reporting_views.md");
  for (const required of [
    "latest_prices",
    "observations",
    "weekly_baskets",
    "basket_items",
    "source_runs",
    "products",
    "chains",
    "stores",
  ]) {
    assert.match(sqlDoc, new RegExp(`\\b${required}\\b`), `${required} is not referenced`);
  }
  assert.match(sqlDoc, /CREATE OR REPLACE VIEW vw_bi_current_product_prices/);
  assert.match(sqlDoc, /CREATE OR REPLACE VIEW vw_bi_chain_price_index/);
  assert.match(sqlDoc, /CREATE OR REPLACE VIEW vw_bi_basket_cost_by_chain/);
});

test("SQL reporting views are syntactically well-formed", () => {
  const sqlDoc = read("docs/bi-portfolio/04_sql_reporting_views.md");

  // Code fences must be balanced (a dropped closing fence means a truncated doc).
  const fenceCount = (sqlDoc.match(/```/g) || []).length;
  assert.equal(fenceCount % 2, 0, "unbalanced ``` code fences in SQL views doc");

  const blocks = [...sqlDoc.matchAll(/```sql\n([\s\S]*?)```/g)].map((match) => match[1]);
  assert.ok(blocks.length > 0, "no fenced SQL blocks found");
  const sql = blocks.join("\n");

  // Balanced parentheses — catches statements truncated mid-expression.
  const open = (sql.match(/\(/g) || []).length;
  const close = (sql.match(/\)/g) || []).length;
  assert.equal(open, close, `unbalanced parentheses (${open} '(' vs ${close} ')') — likely a truncated statement`);

  // Every CREATE VIEW must be terminated; the SQL must end on a finished statement.
  const views = (sql.match(/CREATE OR REPLACE VIEW/g) || []).length;
  const terminators = (sql.match(/;/g) || []).length;
  assert.ok(terminators >= views, `found ${views} views but only ${terminators} terminators — a view may be truncated`);
  assert.match(sql.trimEnd(), /;\s*$/, "SQL does not end with a terminated statement (truncated view)");

  // Common literal mistakes that only surface against a real database.
  assert.doesNotMatch(sql, /\bINTERVAL\s+\d/i, "INTERVAL must use a quoted literal, e.g. INTERVAL '30 days'");
  assert.doesNotMatch(sql, /=\s*(grocery|pharmacy|fuel)\b/i, "domain comparisons must quote the literal, e.g. = 'grocery'");
  assert.doesNotMatch(sql.replace(/'infinity'/gi, ""), /\binfinity\b/i, "infinity must be quoted, e.g. 'infinity'::timestamptz");
});

test("BI portfolio markdown links resolve inside the repo", () => {
  const markdownLink = /\[[^\]]+\]\(([^)]+)\)/g;
  const filesToCheck = ["README.md", ...expectedFiles.map((file) => path.join("docs", "bi-portfolio", file))];

  for (const relativeFile of filesToCheck) {
    const content = read(relativeFile);
    for (const match of content.matchAll(markdownLink)) {
      const href = match[1];
      if (/^(https?:|mailto:|#)/.test(href) || href.startsWith("`")) continue;
      const hrefWithoutAnchor = href.split("#")[0];
      if (!hrefWithoutAnchor) continue;
      const baseDir = path.dirname(path.join(repoRoot, relativeFile));
      const target = hrefWithoutAnchor.startsWith("docs/")
        ? path.join(repoRoot, hrefWithoutAnchor)
        : path.resolve(baseDir, hrefWithoutAnchor);
      assert.ok(existsSync(target), `${relativeFile} has broken link ${href}`);
    }
  }
});
