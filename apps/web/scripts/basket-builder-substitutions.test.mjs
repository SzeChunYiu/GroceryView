import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const Module = require('node:module');
const ts = require('typescript');

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const webRoot = resolve(scriptsDir, '..');

function childNodes(children) {
  if (children === undefined || children === null || typeof children === 'boolean') return [];
  return Array.isArray(children) ? children : [children];
}

function textContent(element) {
  if (element === undefined || element === null || typeof element === 'boolean') return '';
  if (typeof element === 'string' || typeof element === 'number') return String(element);
  if (Array.isArray(element)) return element.map(textContent).join('');
  return childNodes(element.props?.children).map(textContent).join('');
}

function walk(element, visit) {
  if (element === undefined || element === null || typeof element !== 'object') return;
  visit(element);
  for (const child of childNodes(element.props?.children)) walk(child, visit);
}

function flatten(element) {
  const elements = [];
  walk(element, (node) => elements.push(node));
  return elements;
}

function installBasketRuntime() {
  const originalResolveFilename = Module._resolveFilename;
  const originalTsLoader = Module._extensions['.ts'];
  const originalTsxLoader = Module._extensions['.tsx'];
  let hooks = [];
  let hookIndex = 0;

  const fakeReact = {
    useState(initialValue) {
      const index = hookIndex;
      hookIndex += 1;
      if (hooks[index] === undefined) hooks[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [hooks[index], (nextValue) => {
        hooks[index] = typeof nextValue === 'function' ? nextValue(hooks[index]) : nextValue;
      }];
    }
  };
  const fakeJsxRuntime = {
    Fragment: Symbol.for('react.fragment'),
    jsx(type, props, key) {
      return { type, key, props: props ?? {} };
    },
    jsxs(type, props, key) {
      return { type, key, props: props ?? {} };
    }
  };

  function transpileTypeScript(module, filename) {
    const source = readFileSync(filename, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        esModuleInterop: true,
        jsx: ts.JsxEmit.ReactJSX,
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022
      },
      fileName: filename
    });
    module._compile(outputText, filename);
  }

  Module._extensions['.ts'] = transpileTypeScript;
  Module._extensions['.tsx'] = transpileTypeScript;
  Module._resolveFilename = function resolveBasketImports(request, parent, isMain, options) {
    if (request === 'react') return 'groceryview-fake-react';
    if (request === 'react/jsx-runtime') return 'groceryview-fake-jsx-runtime';
    if (request.startsWith('@/')) return originalResolveFilename.call(this, join(webRoot, 'src', request.slice(2)), parent, isMain, options);
    if (request.startsWith('.') && parent?.filename) {
      const extensionless = resolve(dirname(parent.filename), request);
      for (const extension of ['', '.ts', '.tsx']) {
        const candidate = `${extensionless}${extension}`;
        if (existsSync(candidate)) return originalResolveFilename.call(this, candidate, parent, isMain, options);
      }
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
  };
  require.cache['groceryview-fake-react'] = { exports: fakeReact };
  require.cache['groceryview-fake-jsx-runtime'] = { exports: fakeJsxRuntime };

  return {
    resetHooks() {
      hooks = [];
      hookIndex = 0;
    },
    beginRender() {
      hookIndex = 0;
    },
    cleanup() {
      Module._resolveFilename = originalResolveFilename;
      if (originalTsLoader) Module._extensions['.ts'] = originalTsLoader;
      else delete Module._extensions['.ts'];
      if (originalTsxLoader) Module._extensions['.tsx'] = originalTsxLoader;
      else delete Module._extensions['.tsx'];
      delete require.cache['groceryview-fake-react'];
      delete require.cache['groceryview-fake-jsx-runtime'];
      delete require.cache[require.resolve('../src/components/basket-builder.tsx')];
    }
  };
}

test('BasketBuilder renders substitution suggestions after Add without auto-replacing the selected item', () => {
  const runtime = installBasketRuntime();
  try {
    const { BasketBuilder } = require('../src/components/basket-builder.tsx');
    const products = [
      {
        id: 'milk',
        name: 'Whole milk',
        suggestedSwaps: [{ id: 'oat-drink', name: 'Oat drink', reason: 'Lower unit price at the same chain' }]
      }
    ];
    const render = () => {
      runtime.beginRender();
      return BasketBuilder({ products });
    };

    runtime.resetHooks();
    const beforeAdd = render();
    assert.doesNotMatch(textContent(beforeAdd), /Oat drink/);

    const addButton = flatten(beforeAdd).find((element) => element.type === 'button' && textContent(element) === 'Add');
    assert.ok(addButton, 'rendered basket builder should expose an Add button');
    addButton.props.onClick();

    const afterAdd = render();
    const selectedBasket = flatten(afterAdd).find((element) => element.type === 'section' && element.props?.['aria-label'] === 'Selected basket items');
    const suggestedSwaps = flatten(afterAdd).find((element) => element.type === 'section' && element.props?.['aria-label'] === 'Suggested basket swaps');

    assert.match(textContent(selectedBasket), /Whole milk/);
    assert.doesNotMatch(textContent(selectedBasket), /Oat drink/);
    assert.match(textContent(suggestedSwaps), /Suggested swaps/);
    assert.match(textContent(suggestedSwaps), /Oat drink for Whole milk/);
    assert.match(textContent(suggestedSwaps), /never auto-replace/);
  } finally {
    runtime.cleanup();
  }
});
