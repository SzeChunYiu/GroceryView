export type PersonalDataLawfulBasis = 'contract' | 'consent' | 'legitimate_interest' | 'legal_obligation';

export type PersonalDataRegistryEntry = {
  table: string;
  category: string;
  purpose: string;
  lawfulBasis: PersonalDataLawfulBasis;
  retention: string;
  processors: string[];
  exportCoverage: boolean;
  deleteCoverage: boolean;
  owningPackage: string;
};

export type PersonalDataRegistryVerification = {
  ok: boolean;
  requiredTables: string[];
  missingTables: string[];
};

export const personalDataRegistry = [
  {
    table: 'app_users',
    category: 'account_profile',
    purpose: 'Identify signed-in grocery shoppers and route account-owned records.',
    lawfulBasis: 'contract',
    retention: 'Until account deletion or verified inactivity cleanup.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'favorite_stores',
    category: 'store_preferences',
    purpose: 'Remember preferred stores for alerts, basket comparison, and trip planning.',
    lawfulBasis: 'contract',
    retention: 'Until removed by the user or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'user_preferences',
    category: 'account_preferences',
    purpose: 'Store currency, notification, budget, and personalization preferences.',
    lawfulBasis: 'contract',
    retention: 'Until overwritten by the user or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'watchlist_items',
    category: 'price_alerts',
    purpose: 'Track watched products and alert thresholds for account-bound notifications.',
    lawfulBasis: 'contract',
    retention: 'Until alert removal or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'weekly_baskets',
    category: 'shopping_lists',
    purpose: 'Persist account-owned weekly basket containers.',
    lawfulBasis: 'contract',
    retention: 'Until list deletion or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'basket_items',
    category: 'shopping_lists',
    purpose: 'Persist item-level grocery list contents and quantities.',
    lawfulBasis: 'contract',
    retention: 'Until list deletion or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'basket_import_review_items',
    category: 'basket_imports',
    purpose: 'Review imported basket lines before saving matched grocery items.',
    lawfulBasis: 'contract',
    retention: 'Until review completion or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'receipt_uploads',
    category: 'receipts',
    purpose: 'Store receipt upload metadata for OCR and shopper purchase history workflows.',
    lawfulBasis: 'consent',
    retention: 'Until receipt deletion, account deletion, or receipt retention expiry.',
    processors: ['GroceryView API', 'PostgreSQL', 'OCR provider'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'receipt_items',
    category: 'receipts',
    purpose: 'Store parsed receipt line items linked to receipt uploads.',
    lawfulBasis: 'consent',
    retention: 'Until receipt deletion, account deletion, or receipt retention expiry.',
    processors: ['GroceryView API', 'PostgreSQL', 'OCR provider'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'household_plans',
    category: 'households',
    purpose: 'Coordinate household grocery planning for invited members.',
    lawfulBasis: 'contract',
    retention: 'Until household removal or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'household_members',
    category: 'households',
    purpose: 'Track household membership and display names.',
    lawfulBasis: 'contract',
    retention: 'Until household removal, member removal, or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'household_basket_items',
    category: 'households',
    purpose: 'Persist shared household basket items.',
    lawfulBasis: 'contract',
    retention: 'Until household basket removal or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'household_watchlist_items',
    category: 'households',
    purpose: 'Persist shared household watchlist items.',
    lawfulBasis: 'contract',
    retention: 'Until household watchlist removal or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'household_favorite_stores',
    category: 'households',
    purpose: 'Persist shared household store preferences.',
    lawfulBasis: 'contract',
    retention: 'Until household preference removal or account deletion.',
    processors: ['GroceryView API', 'PostgreSQL'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  },
  {
    table: 'analytics_events',
    category: 'analytics',
    purpose: 'Represent account-scoped analytics export coverage; no persisted analytics table is currently enabled.',
    lawfulBasis: 'legitimate_interest',
    retention: 'Not retained until a persisted analytics table is introduced.',
    processors: ['GroceryView API'],
    exportCoverage: true,
    deleteCoverage: true,
    owningPackage: '@groceryview/db'
  }
] as const satisfies readonly PersonalDataRegistryEntry[];

export function personalDataRegistryEntryForTable(table: string): PersonalDataRegistryEntry | undefined {
  return personalDataRegistry.find((entry) => entry.table === table);
}

export function verifyPersonalDataRegistryForTables(tables: readonly string[]): PersonalDataRegistryVerification {
  const requiredTables = tables
    .filter((table) => /(^app_users$|user_|watchlist|basket|receipt|household|favorite_stores|analytics)/.test(table))
    .sort();
  const missingTables = requiredTables.filter((table) => !personalDataRegistryEntryForTable(table));

  return {
    ok: missingTables.length === 0,
    requiredTables,
    missingTables
  };
}

export function assertPersonalDataRegistryForTables(tables: readonly string[]): PersonalDataRegistryVerification {
  const result = verifyPersonalDataRegistryForTables(tables);
  if (!result.ok) {
    throw new Error(`Personal data registry entries missing for: ${result.missingTables.join(', ')}`);
  }
  return result;
}
