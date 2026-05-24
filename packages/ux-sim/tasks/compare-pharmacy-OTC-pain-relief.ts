export type UxTaskStep = {
  id: string;
  instruction: string;
  expectedAffordance: string;
  acceptableVariations: string[];
  frictionSignals: string[];
};

export type UxTaskScript = {
  id: string;
  title: string;
  entryPage: string;
  successCriteria: string[];
  steps: UxTaskStep[];
};

export const comparePharmacyOtcPainReliefTask: UxTaskScript = {
  id: 'compare-pharmacy-OTC-pain-relief',
  title: 'Compare OTC pain-relief options in pharmacy evidence',
  entryPage: '/pharmacy',
  successCriteria: [
    'User reaches an OTC pain-relief product or generic comparison page.',
    'User can identify active ingredient, branded/generic alternative, and average savings when evidence exists.',
    'The route keeps medical-advice and prescription guardrails visible.'
  ],
  steps: [
    {
      id: 'open-pharmacy',
      instruction: 'Open the pharmacy evidence route from navigation or direct URL.',
      expectedAffordance: 'A visible Pharmacy or OTC evidence page with source tape and guardrail copy.',
      acceptableVariations: ['Direct /pharmacy load', 'Navigation menu pharmacy link', 'Search result leading to pharmacy'],
      frictionSignals: ['No visible pharmacy entry point', 'Prescription claims mixed into OTC evidence']
    },
    {
      id: 'find-pain-relief',
      instruction: 'Locate a pain-relief OTC item such as Alvedon, Panodil, Ipren, or ibuprofen.',
      expectedAffordance: 'Product rows expose name, brand/EAN, price, and source link.',
      acceptableVariations: ['Browser find within OTC table', 'Search box query', 'Category section scan'],
      frictionSignals: ['Rows lack product names', 'No keyboard path to product row', 'Price/source hidden behind hover only']
    },
    {
      id: 'open-comparison',
      instruction: 'Open the product detail or country pharmacy comparison route.',
      expectedAffordance: 'The product page has a generic alternative signal linked by active ingredient.',
      acceptableVariations: ['/se/pharmacy/[product]', 'Product detail card linking to generic comparison', 'Inline expandable comparison panel'],
      frictionSignals: ['Back navigation loses context', 'Comparison opens in a pop-up', 'No active-ingredient explanation']
    },
    {
      id: 'confirm-savings',
      instruction: 'Compare branded average price against generic average savings.',
      expectedAffordance: 'Savings are shown as SEK and percent with branded/generic row counts.',
      acceptableVariations: ['Average savings card', 'Side-by-side price table', 'No-match empty state with explanation'],
      frictionSignals: ['Fabricated savings without row counts', 'No indication when generic evidence is missing']
    }
  ]
};

export default comparePharmacyOtcPainReliefTask;
