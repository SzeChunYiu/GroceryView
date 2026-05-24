export type UxPersonaSession = {
  personaId: string;
  displayName: string;
  languageProfile: string;
  entryPage: string;
  goals: string[];
  acceptedPaths: string[];
  dealbreakers: string[];
  visualNeeds: string[];
  simulatorAssertions: string[];
};

export const newImmigrantPersona: UxPersonaSession = {
  personaId: 'new-immigrant',
  displayName: 'New immigrant grocery shopper',
  languageProfile: 'Limited Swedish; prefers English labels, plain Swedish fallback, recognizable product photos, and translated category names.',
  entryPage: '/en',
  goals: [
    'Find familiar staple foods by English or Swedish search terms.',
    'Compare prices without needing Swedish grocery abbreviations.',
    'Use product photos, chain logos, unit prices, and translated category names to verify the item before opening a detail page.',
    'Save a short shopping list for a first trip to a nearby store.'
  ],
  acceptedPaths: [
    '/en → search for an English staple → product card with image and unit price → product detail',
    '/en → categories with translated labels → visual product grid → cheapest visible chain row',
    '/en → map/store coverage → nearby chain page → product comparison',
    '/en → basket/list → add item from visual card → review total in SEK'
  ],
  dealbreakers: [
    'Swedish-only navigation or error copy on critical search/list actions.',
    'Cards with no image, no translated category, and no unit-price explanation.',
    'Unexplained Swedish abbreviations such as jämförpris, st, hg, pant, or kampanj.',
    'Dead-end empty states that do not suggest English synonyms or visual categories.',
    'Price comparisons that hide currency, package size, or confidence/coverage.'
  ],
  visualNeeds: [
    'Product thumbnails are visible before brand-specific Swedish names dominate the card.',
    'Language switch remains reachable from mobile navigation.',
    'Unit-price and package-size labels use consistent icon/text hierarchy.',
    'Store and chain logos help identify unfamiliar Swedish retailers.'
  ],
  simulatorAssertions: [
    'English entry routes expose search, category, map, and list paths without requiring Swedish copy comprehension.',
    'Recommendation and deal cards include images or explicit translated text cues.',
    'Empty or low-confidence states provide a next action instead of a Swedish-only blocker.'
  ]
};

export default newImmigrantPersona;
