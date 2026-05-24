import { NextResponse } from 'next/server';
import { createRecurringBasketDuplicate, weeklyRecurringBasketPlan } from '@/lib/recurring-basket';

export async function GET() {
  return NextResponse.json({ plans: [weeklyRecurringBasketPlan] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const targetWindow = weeklyRecurringBasketPlan.duplicateControls.find((control) => control.targetWindow.startsOn === body?.startsOn)?.targetWindow;

  return NextResponse.json(
    {
      duplicate: createRecurringBasketDuplicate(weeklyRecurringBasketPlan, targetWindow),
      controls: weeklyRecurringBasketPlan.duplicateControls,
      guardrails: weeklyRecurringBasketPlan.guardrails
    },
    { status: 201 }
  );
}
