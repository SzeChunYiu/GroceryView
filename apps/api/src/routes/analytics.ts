export const analyticsRoutes = {
  itemCardImpressions: '/api/analytics/item-card-impressions',
  priceAlertFunnel: '/api/analytics/price-alert-funnel',
  priceAlertFunnelDescription: 'Tracks price alert creation funnel steps: button_click, dialog_open, form_submit, and success.',
  priceAlertFunnelSteps: ['button_click', 'dialog_open', 'form_submit', 'success']
} as const;
