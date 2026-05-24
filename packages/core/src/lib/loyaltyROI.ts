export type LoyaltyProgramROIInput = {
  programId: string;
  programName: string;
  pointsPerKrSpent: number;
  pointCashValueKr: number;
  earnRateMultiplier?: number;
  redemptionFeeKr?: number;
  minimumRedemptionPoints?: number;
};

export type LoyaltyProgramROI = LoyaltyProgramROIInput & {
  effectivePointsPerKr: number;
  grossKrBackPerKr: number;
  netKrBackPerKr: number;
  roiPercent: number;
  krBackPer100Kr: number;
  minimumSpendForRedemptionKr: number | null;
};

function finiteNumber(value: number, label: string): number {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label} must be a non-negative finite number.`);
  return value;
}

export function estimateLoyaltyProgramROI(program: LoyaltyProgramROIInput): LoyaltyProgramROI {
  const pointsPerKrSpent = finiteNumber(program.pointsPerKrSpent, 'pointsPerKrSpent');
  const pointCashValueKr = finiteNumber(program.pointCashValueKr, 'pointCashValueKr');
  const earnRateMultiplier = program.earnRateMultiplier === undefined ? 1 : finiteNumber(program.earnRateMultiplier, 'earnRateMultiplier');
  const redemptionFeeKr = program.redemptionFeeKr === undefined ? 0 : finiteNumber(program.redemptionFeeKr, 'redemptionFeeKr');
  const minimumRedemptionPoints = program.minimumRedemptionPoints === undefined ? 0 : finiteNumber(program.minimumRedemptionPoints, 'minimumRedemptionPoints');

  const effectivePointsPerKr = pointsPerKrSpent * earnRateMultiplier;
  const grossKrBackPerKr = effectivePointsPerKr * pointCashValueKr;
  const feeDragPerKr = minimumRedemptionPoints > 0 ? redemptionFeeKr / Math.max(minimumRedemptionPoints / Math.max(effectivePointsPerKr, Number.EPSILON), 1) : 0;
  const netKrBackPerKr = Math.max(grossKrBackPerKr - feeDragPerKr, 0);
  const minimumSpendForRedemptionKr = minimumRedemptionPoints > 0 && effectivePointsPerKr > 0 ? minimumRedemptionPoints / effectivePointsPerKr : null;

  return {
    ...program,
    earnRateMultiplier,
    redemptionFeeKr,
    minimumRedemptionPoints,
    effectivePointsPerKr,
    grossKrBackPerKr,
    netKrBackPerKr,
    roiPercent: netKrBackPerKr * 100,
    krBackPer100Kr: netKrBackPerKr * 100,
    minimumSpendForRedemptionKr
  };
}

export function rankLoyaltyProgramsByROI(programs: readonly LoyaltyProgramROIInput[]): LoyaltyProgramROI[] {
  return programs
    .map(estimateLoyaltyProgramROI)
    .sort((a, b) => {
      const roiDelta = b.netKrBackPerKr - a.netKrBackPerKr;
      if (roiDelta !== 0) return roiDelta;
      return (a.minimumSpendForRedemptionKr ?? Number.POSITIVE_INFINITY) - (b.minimumSpendForRedemptionKr ?? Number.POSITIVE_INFINITY);
    });
}
