export const settingsRoutes = {
  demoUserSettings: 'users/demo/settings',
  account: 'account',
  dataExport: 'data-export',
  preferredStores: 'preferred-stores',
  accountDeletionDescription: 'Delete my account confirmation contract for lists, alerts, preferences, and account profile rows',
  dataExportDescription: 'Download my data JSON export with lists, alerts, preferences, and analytics events',
  preferredStoresDescription: 'Select 1-5 preferred stores to prioritize comparison tables and map lists'
} as const;

export function normalizePreferredStoreIds(storeIds: string[]) {
  return [...new Set(storeIds.map((storeId) => storeId.trim()).filter(Boolean))].slice(0, 5);
}
