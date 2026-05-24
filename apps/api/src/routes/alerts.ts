export const alertsRoutes = {
  demoUserAlerts: 'users/demo/alerts',
  demoUserAlertInbox: 'inbox',
  priceAlertEmailNotifierJob: 'jobs/alerts/price-email-notifier',
  webManagementPage: '/alerts',
  webPriceAlertsApi: '/api/alerts',
  priceAlertThresholdModes: ['target_price', 'percentage_drop'],
  percentageDropMetric: 'price_drop_percent',
  percentageDropExample: 'alert me when 20% cheaper'
} as const;
