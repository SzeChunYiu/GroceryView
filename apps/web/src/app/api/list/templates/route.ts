import { NextResponse, type NextRequest } from 'next/server';
import { findRecurringListTemplate, generateRecurringListInstance, recurringListTemplates } from '@/lib/recurring-lists';

export function GET() {
  return NextResponse.json({
    templates: recurringListTemplates,
    frequencies: ['weekly', 'biweekly'],
    generatedAt: new Date().toISOString()
  });
}

async function templateIdFromRequest(request: NextRequest) {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    return String((await request.formData()).get('templateId') ?? '').trim();
  }
  const body = await request.json().catch(() => ({})) as { templateId?: string };
  return body.templateId?.trim() ?? '';
}

export async function POST(request: NextRequest) {
  const templateId = await templateIdFromRequest(request);
  if (!templateId) {
    return NextResponse.json({ error: 'templateId_required' }, { status: 400 });
  }

  const template = findRecurringListTemplate(templateId);
  if (!template) {
    return NextResponse.json({ error: 'template_not_found' }, { status: 404 });
  }

  return NextResponse.json({
    template,
    instance: generateRecurringListInstance(template),
    action: 'generated_recurring_list_instance'
  });
}
