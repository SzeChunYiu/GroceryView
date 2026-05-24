export const itemsRoutes = {
  controllerPath: 'items',
  detailAlias: 'items/:id',
  seasonalSalePattern: 'items/:id/seasonal-sale-pattern',
  holidayWindow: 'midsommar',
  description: 'Item detail and seasonalSalePattern metadata backed by explicit holiday-window price evidence.',
  queryParams: ['holiday'],
  responseFields: [
    'available',
    'holiday',
    'hint',
    'holidayWindow',
    'observedSeasonCount',
    'qualifiedSeasonCount',
    'evidenceLabel',
    'guardrail'
  ],
  guardrail: 'No seasonal sale hint is returned without repeated explicit historical holiday-window price evidence.'
} as const;
