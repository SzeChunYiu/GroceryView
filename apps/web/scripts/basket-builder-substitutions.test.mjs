import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import vm from "node:vm";
import ts from "typescript";

const rankerPath = new URL("../src/lib/substitution-ranker.ts", import.meta.url);
const basketBuilderPath = new URL("../src/components/basket-builder.tsx", import.meta.url);
const unitNormalizerPath = new URL("../src/lib/unit-normalizer.ts", import.meta.url);

async function loadRanker() {
  const unitNormalizerSource = await readFile(unitNormalizerPath, "utf8");
  const rankerSource = await readFile(rankerPath, "utf8");
  const modules = new Map();

  for (const [id, source] of [
    ["./unit-normalizer", unitNormalizerSource],
    ["ranker", rankerSource],
  ]) {
    const output = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const module = { exports: {} };
    const context = {
      exports: module.exports,
      module,
      require: (specifier) => {
        if (!modules.has(specifier)) {
          throw new Error(`Unexpected module import: ${specifier}`);
        }

        return modules.get(specifier);
      },
    };

    vm.runInNewContext(output, context, { filename: id });
    modules.set(id, module.exports);
  }

  return modules.get("ranker");
}

test("basket substitutions are ranked by same-category cheaper compatible swaps", async () => {
  const { rankSubstitutionsForBasket } = await loadRanker();
  const suggestions = rankSubstitutionsForBasket({
    selectedDietaryFilters: ["vegan"],
    basketItems: [
      {
        id: "premium-oats",
        name: "Premium oats",
        category: "Oats",
        unitPrice: 35,
        unitPriceUnit: "kg",
        dietaryTags: ["vegan"],
      },
    ],
    candidates: [
      {
        id: "budget-oats",
        name: "Budget oats",
        category: "oats",
        unitPrice: 22,
        unitPriceUnit: "kg",
        dietaryTags: ["vegan"],
      },
      {
        id: "cheap-muesli",
        name: "Cheap muesli",
        category: "cereal",
        unitPrice: 12,
        unitPriceUnit: "kg",
        dietaryTags: ["vegan"],
      },
      {
        id: "non-vegan-oats",
        name: "Non-vegan oats",
        category: "oats",
        unitPrice: 18,
        unitPriceUnit: "kg",
        dietaryTags: ["vegetarian"],
      },
      {
        id: "oat-drink",
        name: "Oat drink",
        category: "oats",
        unitPrice: 15,
        unitPriceUnit: "l",
        dietaryTags: ["vegan"],
      },
    ],
  });

  assert.equal(suggestions.length, 1);
  assert.deepEqual(
    suggestions[0].substitutions.map((substitution) => substitution.product.id),
    ["budget-oats"],
  );
  assert.equal(suggestions[0].substitutions[0].savingsPerUnit, 13);
  assert.equal(suggestions[0].substitutions[0].unit, "kg");
});

test("basket builder renders review-only substitution suggestions", async () => {
  const basketBuilder = await readFile(basketBuilderPath, "utf8");

  assert.match(basketBuilder, /rankSubstitutionsForBasket/);
  assert.match(basketBuilder, /selectedDietaryFilters/);
  assert.match(basketBuilder, /Suggested swaps/);
  assert.doesNotMatch(basketBuilder, /setBasketProducts\([^)]*substitution/);
});

test("unit normalizer exposes comparable unit prices for ranker input", async () => {
  const unitNormalizer = await readFile(unitNormalizerPath, "utf8");

  assert.match(unitNormalizer, /export type ComparableUnitPrice/);
  assert.match(unitNormalizer, /export function getComparableUnitPrice/);
  assert.match(unitNormalizer, /normalizeUnitPrice\(price, unit\)/);
  assert.match(unitNormalizer, /label: `kr\/\$\{normalized\.unit\}`/);
});
