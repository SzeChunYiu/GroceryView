export const settingsRoutes = {
  settings: 'api/settings',
  demoUserSettings: 'users/demo/settings',
  preferencesReadDescription: 'Read authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  preferencesDescription: 'Save authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  account: 'account',
  dataExport: 'data-export',
  apiKeys: 'api-keys',
  apiKeyById: 'api-keys/:keyId',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events',
  apiKeysDescription: 'List, generate, and revoke signed-in developer API keys without exposing stored secrets'
} as const;
