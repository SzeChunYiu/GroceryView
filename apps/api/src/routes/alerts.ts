export const alertsRoutes = {
  alerts: 'api/alerts',
  demoUserAlerts: 'users/demo/alerts',
  demoUserAlertInbox: 'inbox',
  authScheme: 'bearer-jwt',
  protectedPaths: ['api/alerts'],
  priceAlertEmailNotifierJob: 'jobs/alerts/price-email-notifier',
  webManagementPage: '/alerts',
  webPriceAlertsApi: '/api/alerts',
  authDescription: 'Account alert routes require a Bearer JWT before reading or mutating user-specific alert data.'
} as const;
