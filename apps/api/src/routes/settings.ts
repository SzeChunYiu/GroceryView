export const settingsRoutes = {
  settings: 'api/settings',
  demoUserSettings: 'users/demo/settings',
  preferencesReadDescription: 'Read authenticated user preferences for currency, preferred stores, and notification channels',
  preferencesDescription: 'Save authenticated user preferences for currency, preferred stores, and notification channels',
  apiKeys: 'api-keys',
  apiKey: 'api-keys/:keyId',
  apiKeysReadDescription: 'List active developer API keys for the authenticated user',
  apiKeysCreateDescription: 'Generate a developer API key and return the plaintext value once',
  apiKeysRevokeDescription: 'Revoke one authenticated developer API key',
  account: 'account',
  dataExport: 'data-export',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events'
} as const;
