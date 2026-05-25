export const settingsRoutes = {
  settings: 'api/settings',
  demoUserSettings: 'users/demo/settings',
  preferencesReadDescription: 'Read authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  preferencesDescription: 'Save authenticated user preferences for currency, preferred stores, notification channels, and MyFlyer algorithm_choice',
  profile: 'profile',
  profilePassword: 'profile/password',
  profileReadDescription: 'Read authenticated user profile metadata including display name, email, and account creation date',
  profileDescription: 'Update authenticated user profile display name',
  profilePasswordDescription: 'Change authenticated user password without returning or logging secrets',
  account: 'account',
  dataExport: 'data-export',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events'
} as const;
