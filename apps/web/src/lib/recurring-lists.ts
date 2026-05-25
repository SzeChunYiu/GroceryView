export type RecurringListFrequency = 'weekly' | 'biweekly';

export type RecurringListTemplateItem = {
  id: string;
  name: string;
  quantity: string;
  department?: string;
};

export type RecurringListTemplate = {
  id: string;
  title: string;
  frequency: RecurringListFrequency;
  anchorWeekday: 'monday' | 'wednesday' | 'friday' | 'saturday';
  items: RecurringListTemplateItem[];
};

export type RecurringListInstance = {
  id: string;
  templateId: string;
  title: string;
  frequency: RecurringListFrequency;
  generatedAt: string;
  shoppingDate: string;
  itemCount: number;
  items: RecurringListTemplateItem[];
};

const weekdayIndexes: Record<RecurringListTemplate['anchorWeekday'], number> = {
  monday: 1,
  wednesday: 3,
  friday: 5,
  saturday: 6
};

export const recurringListTemplates: RecurringListTemplate[] = [
  {
    id: 'weekly-staples',
    title: 'Weekly staples restock',
    frequency: 'weekly',
    anchorWeekday: 'saturday',
    items: [
      { id: 'oat-milk', name: 'Oat milk', quantity: '2 cartons', department: 'Dairy alternative' },
      { id: 'bananas', name: 'Bananas', quantity: '1 bunch', department: 'Produce' },
      { id: 'pasta', name: 'Pasta', quantity: '2 packs', department: 'Pantry' }
    ]
  },
  {
    id: 'biweekly-bulk',
    title: 'Biweekly bulk pantry',
    frequency: 'biweekly',
    anchorWeekday: 'friday',
    items: [
      { id: 'coffee', name: 'Coffee', quantity: '2 bags', department: 'Pantry' },
      { id: 'rice', name: 'Rice', quantity: '1 large bag', department: 'Pantry' },
      { id: 'sparkling-water', name: 'Sparkling water', quantity: '6-pack', department: 'Drinks' }
    ]
  }
];

function nextShoppingDate(template: RecurringListTemplate, now: Date) {
  const targetDay = weekdayIndexes[template.anchorWeekday];
  const currentDay = now.getUTCDay();
  const daysUntil = (targetDay - currentDay + 7) % 7 || (template.frequency === 'weekly' ? 7 : 14);
  const cadenceOffset = template.frequency === 'biweekly' && daysUntil < 7 ? daysUntil + 7 : daysUntil;
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + cadenceOffset));
  return date.toISOString().slice(0, 10);
}

export function findRecurringListTemplate(templateId: string) {
  return recurringListTemplates.find((template) => template.id === templateId) ?? null;
}

export function generateRecurringListInstance(template: RecurringListTemplate, now = new Date()): RecurringListInstance {
  const generatedAt = now.toISOString();
  const shoppingDate = nextShoppingDate(template, now);
  return {
    id: `${template.id}-${shoppingDate}`,
    templateId: template.id,
    title: `${template.title} · ${shoppingDate}`,
    frequency: template.frequency,
    generatedAt,
    shoppingDate,
    itemCount: template.items.length,
    items: template.items
  };
}
