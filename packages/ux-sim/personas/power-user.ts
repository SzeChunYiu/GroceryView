export type UxSimPersona = {
  id: string;
  name: string;
  entryPage: string;
  traits: string[];
  goals: string[];
  acceptedPaths: string[];
  advancedFilters: string[];
  keyboardExpectations: string[];
  dealbreakers: string[];
};

export const powerUserPersona: UxSimPersona = {
  id: 'power-user',
  name: 'Power user',
  entryPage: '/screener?min_discount=20&category=pantry&limit=50',
  traits: [
    'Uses every advanced filter before trusting a result list.',
    'Navigates quickly with keyboard shortcuts and expects focus to stay visible.',
    'Dismisses marketing interruptions and pop-ups immediately.'
  ],
  goals: [
    'Find the highest-confidence grocery deals with source coverage visible.',
    'Compare filtered items across chain, category, unit price, and availability.',
    'Open product, store, and index detail pages without losing filter context.'
  ],
  acceptedPaths: [
    '/screener -> /products/[slug] -> /compare-items',
    '/chain-index -> /index/[symbol] -> /stores/[slug]',
    '/search keyboard query -> filtered result -> product detail'
  ],
  advancedFilters: [
    'minimum discount',
    'category',
    'chain/store',
    'unit-price sort',
    'in-stock or available evidence',
    'confidence/coverage threshold'
  ],
  keyboardExpectations: [
    'Tab order reaches filters, result rows, and pagination in visual order.',
    'Enter opens focused links or applies focused controls.',
    'Escape closes menus, dialogs, and command palettes without clearing filters.',
    'aria-current=page marks the active navigation item.'
  ],
  dealbreakers: [
    'Modal or newsletter pop-ups before completing the task.',
    'Filters that reset on back/forward navigation.',
    'Mouse-only controls with no visible focus state.',
    'Deal cards without source confidence, coverage, or last-observed evidence.',
    'Sponsored or fabricated savings mixed into verified results.'
  ]
};

export default powerUserPersona;
