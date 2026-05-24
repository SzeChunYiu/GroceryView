export const alertsRoutes = {
  demoUserAlerts: 'users/demo/alerts',
  demoUserAlertInbox: 'inbox',
  priceAlertEmailNotifierJob: 'jobs/alerts/price-email-notifier',
  restockAlertNotifierJob: 'jobs/alerts/restock-notifier',
  userRestockWatches: 'users/:userId/alerts/restock-watches',
  webManagementPage: '/alerts',
  webPriceAlertsApi: '/api/alerts',
  webRestockAlertsApi: '/api/alerts/restock'
} as const;
