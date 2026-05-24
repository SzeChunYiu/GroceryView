import type { BulkImportedListItemInput, ShoppingListItem } from '@/hooks/useList';

export type RecurringListFrequency = 'weekly' | 'biweekly';

export type RecurringListTemplateItem = {
  detail: string;
  id: string;
  matchedProductName?: string;
  matchedProductSlug?: string;
  name: string;
  quantity: string;
};

export type RecurringListTemplate = {
  createdAt: string;
  frequency: RecurringListFrequency;
  id: string;
  items: RecurringListTemplateItem[];
  name: string;
};

export type RecurringListInstance = {
  createdAt: string;
  frequency: RecurringListFrequency;
  id: string;
  items: BulkImportedListItemInput[];
  nextRunAt: string;
  templateId: string;
  templateName: string;
};

export const recurringListFrequencies: Record<RecurringListFrequency, { label: string; days: number; description: string }> = {
  weekly: {
    label: 'Weekly',
    days: 7,
    description: 'Generate a fresh copy every week for staples and school-night shops.'
  },
  biweekly: {
    label: 'Biweekly',
    days: 14,
    description: 'Generate every other week for heavier pantry, pet, and household runs.'
  }
};

export const defaultRecurringListTemplates: RecurringListTemplate[] = [
  {
    id: 'weekly-breakfast-staples',
    name: 'Weekly breakfast staples',
    frequency: 'weekly',
    createdAt: '2026-05-25T00:00:00.000Z',
    items: [
      { id: 'coffee-weekly-top-up', name: 'Coffee', quantity: '1 package', detail: 'Weekly basket top-up item' },
      { id: 'oats-breakfast-staple', name: 'Oats', quantity: '1 bag', detail: 'Breakfast staple' },
      { id: 'milk-dairy-run', name: 'Milk or fil', quantity: '2 cartons', detail: 'Dairy aisle check' }
    ]
  },
  {
    id: 'biweekly-dinner-backup',
    name: 'Biweekly dinner backup',
    frequency: 'biweekly',
    createdAt: '2026-05-25T00:00:00.000Z',
    items: [
      { id: 'frozen-vegetables', name: 'Frozen vegetables', quantity: '1 bag', detail: 'Dinner backup item' },
      { id: 'fresh-fruit', name: 'Fresh fruit', quantity: '1 basket', detail: 'Snack and lunchbox item' },
      { id: 'pantry-pasta-sauce', name: 'Pasta sauce', quantity: '2 jars', detail: 'Pantry rotation' }
    ]
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'template';
}

export function normalizeRecurringFrequency(value: unknown): RecurringListFrequency {
  return value === 'biweekly' ? 'biweekly' : 'weekly';
}

export function nextRecurringRunAt(input: { from?: string | Date; frequency: RecurringListFrequency }) {
  const from = input.from instanceof Date ? input.from : new Date(input.from ?? Date.now());
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + recurringListFrequencies[input.frequency].days);
  next.setUTCHours(6, 0, 0, 0);
  return next.toISOString();
}

export function recurringTemplateFromItems(input: {
  createdAt?: string;
  frequency: RecurringListFrequency;
  items: readonly ShoppingListItem[];
  name: string;
}): RecurringListTemplate {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const templateName = input.name.trim() || 'Recurring shopping list';
  const items = input.items.map((item) => ({
    detail: item.detail,
    id: item.id,
    matchedProductName: item.matchedProductName,
    matchedProductSlug: item.matchedProductSlug,
    name: item.name,
    quantity: item.quantity
  }));

  return {
    createdAt,
    frequency: input.frequency,
    id: `template-${slugify(templateName)}-${createdAt.slice(0, 10)}`,
    items,
    name: templateName
  };
}

export function generateRecurringListInstance(template: RecurringListTemplate, options: { createdAt?: string } = {}): RecurringListInstance {
  const createdAt = options.createdAt ?? new Date().toISOString();
  const instanceDate = createdAt.slice(0, 10);
  const instanceId = `${template.id}-${instanceDate}`;

  return {
    createdAt,
    frequency: template.frequency,
    id: instanceId,
    nextRunAt: nextRecurringRunAt({ from: createdAt, frequency: template.frequency }),
    templateId: template.id,
    templateName: template.name,
    items: template.items.map((item) => ({
      detail: `${item.detail} · generated from ${template.name}`,
      id: `${instanceId}-${item.id}`,
      importSource: 'bulk-clipboard',
      matchedProductName: item.matchedProductName,
      matchedProductSlug: item.matchedProductSlug,
      name: item.name,
      quantity: item.quantity
    }))
  };
}
