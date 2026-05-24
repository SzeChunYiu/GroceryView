import { NextResponse } from 'next/server';
import { buildNorwayCoverageReadinessReport, emptyNorwayCoverageReadinessInput, type NorwayCoverageReadinessInput } from '@groceryview/ops';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function norwayCoverageInput(): NorwayCoverageReadinessInput {
  const raw = process.env.NORWAY_COVERAGE_JSON?.trim();
  if (!raw) return emptyNorwayCoverageReadinessInput;
  return JSON.parse(raw) as NorwayCoverageReadinessInput;
}

export async function GET() {
  try {
    return NextResponse.json(buildNorwayCoverageReadinessReport(norwayCoverageInput(), {
      asOf: process.env.NORWAY_COVERAGE_AS_OF?.trim() || undefined
    }));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Invalid Norway coverage readiness input.' },
      { status: 400 }
    );
  }
}
