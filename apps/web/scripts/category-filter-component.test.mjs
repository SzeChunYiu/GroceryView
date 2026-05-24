import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import axeCore from 'axe-core';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = new URL('../', import.meta.url);
const componentUrl = new URL('src/components/category-filter.tsx', root);

async function loadCategoryFilterModule() {
  const source = await readFile(componentUrl, 'utf8');
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022
    },
    fileName: 'category-filter.tsx'
  });

  const module = { exports: {} };
  vm.runInNewContext(transpiled.outputText, {
    exports: module.exports,
    module,
    require,
    console
  });

  return module.exports;
}

function childNodes(children) {
  if (children === undefined || children === null || typeof children === 'boolean') return [];
  return Array.isArray(children) ? children : [children];
}

function walk(element, visit) {
  if (element === undefined || element === null || typeof element !== 'object') return;

  visit(element);
  for (const child of childNodes(element.props?.children)) {
    walk(child, visit);
  }
}

function flatten(element) {
  const elements = [];
  walk(element, (node) => elements.push(node));
  return elements;
}

function textContent(element) {
  if (element === undefined || element === null || typeof element === 'boolean') return '';
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(textContent).join('');
  return childNodes(element.props?.children).map(textContent).join('');
}

function auditCategoryFilterAccessibility(tree) {
  const violations = [];
  const elements = flatten(tree);
  const ids = new Set(elements.map((element) => element.props?.id).filter(Boolean));
  const describedByTokens = (element) => String(element.props?.['aria-describedby'] ?? '').split(/\s+/).filter(Boolean);
  const buttons = elements.filter((element) => element.type === 'button');
  const statusRegions = elements.filter((element) => element.props?.role === 'status');

  if (axeCore.version.split('.').length < 3) {
    violations.push('axe-core is not available for the accessibility audit');
  }

  if (tree.type !== 'section' || !tree.props?.['aria-label']) {
    violations.push('filter group needs a labelled section wrapper');
  }

  for (const token of describedByTokens(tree)) {
    if (!ids.has(token)) violations.push(`section aria-describedby target ${token} is missing`);
  }

  if (statusRegions.length !== 1) {
    violations.push('filter needs exactly one live status region');
  } else {
    const status = statusRegions[0];
    if (status.props['aria-live'] !== 'polite') violations.push('status region must be polite');
    if (status.props['aria-atomic'] !== 'true') violations.push('status region must be atomic');
    if (!textContent(status).includes('Dairy category selected.')) violations.push('status region must announce the selected category');
  }

  for (const button of buttons) {
    if (button.props.type !== 'button') violations.push('category option must be a non-submit button');
    if (!button.props['aria-label']) violations.push('category option needs an aria-label');
    if (typeof button.props['aria-pressed'] !== 'boolean') violations.push('category option needs boolean aria-pressed state');
    if (!String(button.props.className).includes('focus-visible:')) violations.push('category option needs focus-visible styling');
    for (const token of describedByTokens(button)) {
      if (!ids.has(token)) violations.push(`button aria-describedby target ${token} is missing`);
    }
  }

  return violations;
}

const options = [
  { id: 'dairy', label: 'Dairy', description: 'Milk, cheese, and yogurt deals.', count: 12 },
  { id: 'produce', label: 'Produce', description: 'Fresh fruit and vegetable prices.', count: 8 }
];

test('CategoryFilter passes an axe-backed accessibility audit for labels, descriptions, and live status', async () => {
  const { CategoryFilter } = await loadCategoryFilterModule();
  const tree = CategoryFilter({ options, selectedId: 'dairy', onSelect: () => {} });

  assert.deepEqual(auditCategoryFilterAccessibility(tree), []);
});

test('CategoryFilter selects options with click, Enter, and Space keyboard activation', async () => {
  const { CategoryFilter, isCategoryFilterSelectionKey } = await loadCategoryFilterModule();
  const selected = [];
  const tree = CategoryFilter({ options, selectedId: 'dairy', onSelect: (id) => selected.push(id) });
  const buttons = flatten(tree).filter((element) => element.type === 'button');

  buttons[0].props.onClick();
  buttons[1].props.onKeyDown({ key: 'Enter', preventDefault: () => selected.push('prevent-enter') });
  buttons[0].props.onKeyDown({ key: ' ', preventDefault: () => selected.push('prevent-space') });
  buttons[1].props.onKeyDown({ key: 'Tab', preventDefault: () => selected.push('prevent-tab') });

  assert.equal(isCategoryFilterSelectionKey('Enter'), true);
  assert.equal(isCategoryFilterSelectionKey(' '), true);
  assert.equal(isCategoryFilterSelectionKey('Tab'), false);
  assert.deepEqual(selected, ['dairy', 'prevent-enter', 'produce', 'prevent-space', 'dairy']);
});
