export type RecurringPantryItem = {
  name: string;
  addQuantity: string;
  lowStockThreshold: number;
};

export type RecurringPantryTemplate = {
  id: string;
  title: string;
  intervalDays: number;
  lastAddedOn: string;
  nextAddOn: string;
  items: RecurringPantryItem[];
};

export type PantryStockLevels = Record<string, number>;

export const recurringPantryTemplates: RecurringPantryTemplate[] = [
  {
    id: 'breakfast-staples',
    title: 'Breakfast staples',
    intervalDays: 7,
    lastAddedOn: '2026-05-17',
    nextAddOn: '2026-05-24',
    items: [
      { name: 'Havregryn', addQuantity: '2 packs', lowStockThreshold: 1 },
      { name: 'Kaffe', addQuantity: '1 bag', lowStockThreshold: 1 },
      { name: 'Mjölk', addQuantity: '3 cartons', lowStockThreshold: 2 }
    ]
  },
  {
    id: 'weekday-dinners',
    title: 'Weekday dinner base',
    intervalDays: 14,
    lastAddedOn: '2026-05-10',
    nextAddOn: '2026-05-24',
    items: [
      { name: 'Pasta', addQuantity: '2 packs', lowStockThreshold: 1 },
      { name: 'Krossade tomater', addQuantity: '4 cans', lowStockThreshold: 2 },
      { name: 'Ris', addQuantity: '1 bag', lowStockThreshold: 1 }
    ]
  },
  {
    id: 'cleaning-restock',
    title: 'Cleaning restock',
    intervalDays: 30,
    lastAddedOn: '2026-05-12',
    nextAddOn: '2026-06-11',
    items: [
      { name: 'Diskmedel', addQuantity: '1 bottle', lowStockThreshold: 1 },
      { name: 'Tvättmedel', addQuantity: '1 box', lowStockThreshold: 1 }
    ]
  }
];

export const demoPantryStockLevels: PantryStockLevels = {
  Havregryn: 0,
  Kaffe: 1,
  Mjölk: 4,
  Pasta: 1,
  'Krossade tomater': 1,
  Ris: 0,
  Diskmedel: 0,
  Tvättmedel: 1
};

function isDue(nextAddOn: string, today: string) {
  return Date.parse(`${nextAddOn}T00:00:00Z`) <= Date.parse(`${today}T00:00:00Z`);
}

export function getRecurringPantryTopUps(stockLevels: PantryStockLevels, today = '2026-05-24') {
  return recurringPantryTemplates
    .filter((template) => isDue(template.nextAddOn, today))
    .map((template) => ({
      ...template,
      items: template.items.filter((item) => (stockLevels[item.name] ?? 0) <= item.lowStockThreshold)
    }))
    .filter((template) => template.items.length > 0);
}
