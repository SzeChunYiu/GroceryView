import { NextRequest, NextResponse } from 'next/server';
import {
  defaultRecurringListTemplates,
  generateRecurringListInstance,
  normalizeRecurringFrequency,
  recurringTemplateFromItems,
  type RecurringListTemplateItem
} from '@/lib/recurring-lists';
import type { ShoppingListItem } from '@/hooks/useList';

export const dynamic = 'force-dynamic';

type TemplateRequestBody = {
  action?: 'create-template' | 'generate-instance';
  frequency?: string;
  items?: RecurringListTemplateItem[];
  name?: string;
  templateId?: string;
};

function shoppingItemsFromTemplateItems(items: RecurringListTemplateItem[] | undefined): ShoppingListItem[] {
  return Array.isArray(items)
    ? items
      .filter((item) => item && typeof item.id === 'string' && typeof item.name === 'string')
      .map((item) => ({
        checked: false,
        detail: String(item.detail ?? 'Recurring template item'),
        id: item.id,
        matchedProductName: item.matchedProductName,
        matchedProductSlug: item.matchedProductSlug,
        name: item.name,
        quantity: String(item.quantity ?? '1')
      }))
    : [];
}

export async function GET() {
  return NextResponse.json({
    templates: defaultRecurringListTemplates,
    frequencies: ['weekly', 'biweekly']
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as TemplateRequestBody;
  const frequency = normalizeRecurringFrequency(body.frequency);

  if (body.action === 'create-template') {
    const template = recurringTemplateFromItems({
      frequency,
      items: shoppingItemsFromTemplateItems(body.items),
      name: body.name ?? 'Recurring shopping list'
    });

    return NextResponse.json({ template }, { status: 201 });
  }

  const template = defaultRecurringListTemplates.find((candidate) => candidate.id === body.templateId)
    ?? recurringTemplateFromItems({
      frequency,
      items: shoppingItemsFromTemplateItems(body.items),
      name: body.name ?? 'Recurring shopping list'
    });

  return NextResponse.json({ instance: generateRecurringListInstance(template) }, { status: 201 });
}
