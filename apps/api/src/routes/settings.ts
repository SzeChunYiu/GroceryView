export const settingsRoutes = {
  demoUserSettings: 'users/demo/settings',
  hidden: 'hidden',
  hiddenItems: 'hidden/items',
  hiddenItem: 'hidden/items/:productId',
  hiddenStores: 'hidden/stores',
  hiddenStore: 'hidden/stores/:storeId',
  account: 'account',
  dataExport: 'data-export',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events',
  hiddenDescription: 'Hidden products and stores excluded from signed-in comparisons and results'
} as const;
