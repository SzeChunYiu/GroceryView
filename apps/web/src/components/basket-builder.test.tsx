import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import type { BasketBuilderProduct } from './basket-builder';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/' });
Object.defineProperties(globalThis, {
  window: { value: dom.window, configurable: true },
  document: { value: dom.window.document, configurable: true },
  HTMLElement: { value: dom.window.HTMLElement, configurable: true },
  Node: { value: dom.window.Node, configurable: true },
  navigator: { value: dom.window.navigator, configurable: true }
});

const products: BasketBuilderProduct[] = [
  {
    id: 'milk',
    slug: 'milk',
    name: 'Milk',
    brand: 'Dairy Co',
    packageLabel: '1 l',
    categoryLabel: 'Dairy',
    image: null,
    prices: [
      { chainId: 'coop', chainName: 'Coop', price: 14, priceText: '14 kr', priceUnit: 'st', savings: null },
      { chainId: 'ica', chainName: 'ICA', price: 12, priceText: '12 kr', priceUnit: 'st', savings: null }
    ]
  },
  {
    id: 'bread',
    slug: 'bread',
    name: 'Bread',
    brand: 'Bakery Co',
    packageLabel: '500 g',
    categoryLabel: 'Bakery',
    image: null,
    prices: [
      { chainId: 'coop', chainName: 'Coop', price: 28, priceText: '28 kr', priceUnit: 'st', savings: null },
      { chainId: 'ica', chainName: 'ICA', price: 31, priceText: '31 kr', priceUnit: 'st', savings: null }
    ]
  },
  {
    id: 'coffee',
    slug: 'coffee',
    name: 'Coffee',
    brand: 'Roasters',
    packageLabel: '450 g',
    categoryLabel: 'Pantry',
    image: null,
    prices: [
      { chainId: 'coop', chainName: 'Coop', price: 64, priceText: '64 kr', priceUnit: 'st', savings: null },
      { chainId: 'ica', chainName: 'ICA', price: 59, priceText: '59 kr', priceUnit: 'st', savings: null }
    ]
  }
];

function activeElementLabel() {
  const active = document.activeElement;
  assert.ok(active instanceof HTMLElement);
  return active.getAttribute('aria-label') ?? active.textContent?.replace(/\s+/g, ' ').trim() ?? active.tagName;
}

test('BasketBuilder has a logical keyboard tab order across every interactive element', async () => {
  document.body.innerHTML = '';
  const [{ render, screen }, { default: userEvent }, { BasketBuilder }] = await Promise.all([
    import('@testing-library/react'),
    import('@testing-library/user-event'),
    import('./basket-builder')
  ]);
  const user = userEvent.setup({ document });
  render(<BasketBuilder products={products} sourceLabel="keyboard test" />);

  const expectedTabOrder = [
    'Toggle Milk',
    'Toggle Bread',
    'Toggle Coffee',
    'Open Milk',
    'Open Bread',
    'Open Coffee'
  ];

  const interactiveElements = [
    screen.getByRole('checkbox', { name: 'Toggle Milk' }),
    screen.getByRole('checkbox', { name: 'Toggle Bread' }),
    screen.getByRole('checkbox', { name: 'Toggle Coffee' }),
    screen.getByRole('link', { name: 'Open Milk' }),
    screen.getByRole('link', { name: 'Open Bread' }),
    screen.getByRole('link', { name: 'Open Coffee' })
  ];

  const tabOrder: string[] = [];
  for (const element of interactiveElements) {
    await user.tab();
    assert.equal(document.activeElement, element);
    tabOrder.push(activeElementLabel());
  }

  assert.deepEqual(tabOrder, expectedTabOrder);

  for (let index = interactiveElements.length - 2; index >= 0; index -= 1) {
    await user.tab({ shift: true });
    assert.equal(document.activeElement, interactiveElements[index]);
  }
});
