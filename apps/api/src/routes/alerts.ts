export const alertsRoutes = {
  demoUserAlerts: 'users/demo/alerts',
  demoUserAlertInbox: 'inbox',
  priceAlertEmailNotifierJob: 'jobs/alerts/price-email-notifier',
  createPriceAlert: {
    method: 'POST',
    path: 'api/alerts',
    description: 'Create an authenticated price alert for itemId, targetPrice, and email or push notification delivery.',
    requiredBody: ['itemId', 'targetPrice', 'notificationChannel'],
    auth: 'bearer'
  },
  webManagementPage: '/alerts',
  webPriceAlertsApi: '/api/alerts'
} as const;
