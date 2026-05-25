import { NextResponse } from 'next/server';
import {
  buildIcelandCoverageReadinessReport,
  emptyIcelandCoverageReadinessInput,
  type IcelandCoverageReadinessInput
} from '@groceryview/ops';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function icelandCoverageInput(): IcelandCoverageReadinessInput {
  const raw = process.env.ICELAND_COVERAGE_JSON?.trim();
  if (!raw) return emptyIcelandCoverageReadinessInput;
  return JSON.parse(raw) as IcelandCoverageReadinessInput;
}

export async function GET() {
  try {
    return NextResponse.json(buildIcelandCoverageReadinessReport(icelandCoverageInput(), {
      asOf: process.env.ICELAND_COVERAGE_AS_OF?.trim() || undefined
    }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid Iceland coverage readiness input.' },
      { status: 400 }
    );
  }
}
