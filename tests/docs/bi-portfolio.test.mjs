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
