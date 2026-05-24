export const itemsRoutes = {
  controllerPath: 'items',
  detailAlias: 'items/:id',
  seasonalSalePattern: 'items/:id/seasonal-sale-pattern',
  substitutionSuggestions: 'items/:id/substitution-suggestions',
  holidayWindow: 'midsommar',
  description: 'Item detail, seasonalSalePattern metadata, substitutionSuggestions, and localized product names backed by explicit current price evidence.',
  queryParams: ['holiday', 'locale'],
  localeHeader: 'x-groceryview-locale',
  localeCookie: 'NEXT_LOCALE',
  localizedProductNameColumns: ['name_sv', 'name_en'],
  localizedResponseFields: ['canonicalName', 'productName'],
  maxSuggestions: 3,
  responseFields: [
    'available',
    'holiday',
    'hint',
    'holidayWindow',
    'observedSeasonCount',
    'qualifiedSeasonCount',
    'evidenceLabel',
    'trigger',
    'suggestions',
    'currentPrice',
    'savingsPercent',
    'guardrail'
  ],
  guardrail: 'No seasonal sale hint is returned without repeated explicit historical holiday-window price evidence. Substitution suggestions only return same-category, in-stock items with a verified lower current price.'
} as const;
