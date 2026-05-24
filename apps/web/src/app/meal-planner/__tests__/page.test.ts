import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const copyKeyPaths = () => {
  const pageSource = readFileSync(new URL('../page.tsx', import.meta.url), 'utf8');
  const copyBlock = pageSource.match(/const COPY = \{[\s\S]*?\n\} as const;/)?.[0];

  if (!copyBlock) {
    throw new Error('Expected page.tsx to define a top-of-file COPY object.');
  }

  const stack: Array<{ indent: number; key: string }> = [];
  const keyPaths: string[] = [];

  copyBlock.split('\n').forEach((line) => {
    const match = line.match(/^(\s*)([a-z][A-Za-z0-9]*):/);

    if (!match) {
      return;
    }

    const indent = match[1].length;
    const key = match[2];

    while (stack.length && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    const path = [...stack.map((entry) => entry.key), key].join('.');
    keyPaths.push(path);

    if (line.trim().endsWith('{')) {
      stack.push({ indent, key });
    }
  });

  return keyPaths;
};

describe('meal planner page copy', () => {
  it('keeps UI strings grouped in the COPY object', () => {
    expect(copyKeyPaths()).toMatchInlineSnapshot(`
      [
        "hero",
        "hero.eyebrow",
        "hero.title",
        "hero.description",
        "metrics",
        "metrics.suggestions",
        "metrics.suggestions.label",
        "metrics.suggestions.fromPrefix",
        "metrics.suggestions.fromSuffix",
        "metrics.budget",
        "metrics.budget.label",
        "metrics.budget.forPrefix",
        "metrics.budget.forSuffix",
        "metrics.confidence",
        "metrics.confidence.label",
        "metrics.confidence.labelSuffix",
        "suggestedMeals",
        "suggestedMeals.title",
        "student",
        "student.title",
        "student.description",
        "family",
        "family.title",
        "family.description",
        "family.lunchboxReady",
        "family.dinnerOnly",
        "freezer",
        "freezer.title",
        "freezer.description",
        "freezer.portionsLabel",
        "dietary",
        "dietary.eyebrow",
        "dietary.title",
        "dietary.descriptionPrefix",
        "dietary.descriptionSuffix",
        "dietary.preferenceFieldsTitle",
        "dietary.exampleEvidenceTitle",
        "dietary.statusLabel",
        "dietary.intentLabel",
        "dietary.recommendationsLabel",
        "dietary.guardrailsTitle",
        "units",
        "units.perServing",
        "separators",
        "separators.dealScore",
        "separators.dot",
      ]
    `);
  });
});
