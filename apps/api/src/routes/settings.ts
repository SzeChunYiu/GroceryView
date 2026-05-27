export const settingsRoutes = {
  settings: 'api/settings',
  demoUserSettings: 'users/demo/settings',
  preferencesReadDescription: 'Read authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  preferencesDescription: 'Save authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  account: 'account',
  profilePassword: 'profile/password',
  dataExport: 'data-export',
  passwordChangeDescription: 'Verify the current password and persist a rotated password credential for the signed-in account',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events'
} as const;
