export type PersonaSession = {
  id: string;
  label: string;
  age: number;
  region: string;
  techLiteracy: 'basic' | 'intermediate' | 'advanced';
  shoppingPreference: string;
  entryPage: string;
  goals: string[];
  acceptedPaths: string[];
  dealbreakers: string[];
  typicalSession: Array<{
    step: string;
    intent: string;
    successSignal: string;
  }>;
};

export const seniorPersona: PersonaSession = {
  id: 'senior-smaland-print-flyer',
  label: 'Senior shopper in Småland',
  age: 70,
  region: 'Småland, Sweden',
  techLiteracy: 'basic',
  shoppingPreference: 'Prefers the printed weekly flyer and uses the website only when it feels clearer than paper.',
  entryPage: '/deals',
  goals: [
    'Confirm whether familiar flyer offers are still valid before leaving home.',
    'Find the nearest store with simple opening-hours and route context.',
    'Print or write down a short shopping list without signing in.',
    'Avoid confusing member-only or app-only offers unless clearly labelled.'
  ],
  acceptedPaths: [
    '/deals -> flyer-labelled offer card -> product detail with large price and validity dates',
    '/stores -> nearest familiar chain -> address, opening hours, and print-friendly notes',
    '/weekly-basket -> staples list -> print shopping list',
    '/data-sources -> plain-language source caveat when a price is missing or stale'
  ],
  dealbreakers: [
    'Small text, low contrast, or icon-only controls.',
    'Mandatory account creation, app install, or BankID before seeing public flyer prices.',
    'Hidden member-only conditions or unclear validity dates.',
    'Auto-playing maps, popups, or cookie flows that block printing the list.',
    'Prices that look estimated without an explicit source and date.'
  ],
  typicalSession: [
    {
      step: 'Open deals from a bookmarked browser shortcut',
      intent: 'Check the same offers seen in the printed flyer.',
      successSignal: 'Flyer source, price, package size, and valid-through date are visible without scrolling far.'
    },
    {
      step: 'Tab through offer cards and open one staple product',
      intent: 'Use keyboard or slow pointer movement without losing place.',
      successSignal: 'Focus ring is visible and the product page repeats the offer in plain language.'
    },
    {
      step: 'Add two or three staples to a short list',
      intent: 'Prepare a paper note for the next store visit.',
      successSignal: 'The list can be printed or copied and keeps missing-price warnings visible.'
    },
    {
      step: 'Check store page before leaving home',
      intent: 'Avoid travelling to a closed or unfamiliar branch.',
      successSignal: 'Address, opening-hours context, and source caveat are readable at large text sizes.'
    }
  ]
};

export default seniorPersona;
