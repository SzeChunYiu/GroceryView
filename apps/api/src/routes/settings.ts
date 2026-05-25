export const settingsRoutes = {
  settings: 'api/settings',
  demoUserSettings: 'users/demo/settings',
  authScheme: 'bearer-jwt',
  protectedPaths: ['api/settings'],
  preferencesReadDescription: 'Read authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  preferencesDescription: 'Save authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  account: 'account',
  dataExport: 'data-export',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events'
} as const;
