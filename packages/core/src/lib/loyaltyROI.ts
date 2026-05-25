export type LoyaltyProgramInput = Readonly<{
  programId: string;
  programName: string;
  pointsEarnedPerKr: number;
  pointValueKr: number;
  minimumSpendKr?: number;
  monthlyFeeKr?: number;
  estimatedMonthlySpendKr?: number;
}>;

export type LoyaltyProgramROI = LoyaltyProgramInput & Readonly<{
  rank: number;
  grossKrBackPerKr: number;
  netKrBackPerKr: number;
  grossRoiPercent: number;
  netRoiPercent: number;
  monthlyPointsEarned: number;
  monthlyValueKr: number;
  monthlyNetValueKr: number;
  explanation: string;
}>;

export type RankLoyaltyProgramROIInput = Readonly<{
  programs: readonly LoyaltyProgramInput[];
  estimatedMonthlySpendKr?: number;
  topN?: number;
}>;

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const roundRate = (value: number) => Math.round((value + Number.EPSILON) * 10_000) / 10_000;
const roundPercent = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

function assertNonBlank(value: string, fieldName: string) {
  if (!value.trim()) throw new Error(`${fieldName} is required.`);
}

function assertNonNegativeFinite(value: number | undefined, fieldName: string) {
  if (value !== undefined && (!Number.isFinite(value) || value < 0)) throw new Error(`${fieldName} must be a non-negative finite number.`);
}

function validateProgram(program: LoyaltyProgramInput) {
  assertNonBlank(program.programId, 'programId');
  assertNonBlank(program.programName, 'programName');
  assertNonNegativeFinite(program.pointsEarnedPerKr, 'pointsEarnedPerKr');
  assertNonNegativeFinite(program.pointValueKr, 'pointValueKr');
  assertNonNegativeFinite(program.minimumSpendKr, 'minimumSpendKr');
  assertNonNegativeFinite(program.monthlyFeeKr, 'monthlyFeeKr');
  assertNonNegativeFinite(program.estimatedMonthlySpendKr, 'estimatedMonthlySpendKr');
}

function roiForProgram(program: LoyaltyProgramInput, fallbackMonthlySpendKr: number, rank: number): LoyaltyProgramROI {
  const monthlySpendKr = program.estimatedMonthlySpendKr ?? fallbackMonthlySpendKr;
  const monthlyFeeKr = program.monthlyFeeKr ?? 0;
  const earnsPoints = monthlySpendKr >= (program.minimumSpendKr ?? 0);
  const monthlyPointsEarned = earnsPoints ? monthlySpendKr * program.pointsEarnedPerKr : 0;
  const monthlyValueKr = roundMoney(monthlyPointsEarned * program.pointValueKr);
  const monthlyNetValueKr = roundMoney(monthlyValueKr - monthlyFeeKr);
  const grossKrBackPerKr = roundRate(program.pointsEarnedPerKr * program.pointValueKr);
  const netKrBackPerKr = monthlySpendKr > 0 ? roundRate(monthlyNetValueKr / monthlySpendKr) : 0;
  const grossRoiPercent = roundPercent(grossKrBackPerKr * 100);
  const netRoiPercent = roundPercent(netKrBackPerKr * 100);

  return {
    ...program,
    rank,
    grossKrBackPerKr,
    netKrBackPerKr,
    grossRoiPercent,
    netRoiPercent,
    monthlyPointsEarned: roundMoney(monthlyPointsEarned),
    monthlyValueKr,
    monthlyNetValueKr,
    explanation: `${program.programName} returns ${netRoiPercent.toFixed(2)}% net (${netKrBackPerKr.toFixed(4)} kr per kr spent) at ${monthlySpendKr.toFixed(0)} kr monthly spend.`
  };
}

export function rankLoyaltyProgramROI(input: RankLoyaltyProgramROIInput): LoyaltyProgramROI[] {
  const fallbackMonthlySpendKr = input.estimatedMonthlySpendKr ?? 0;
  assertNonNegativeFinite(fallbackMonthlySpendKr, 'estimatedMonthlySpendKr');
  const topN = input.topN ?? input.programs.length;
  if (!Number.isInteger(topN) || topN <= 0) throw new Error('topN must be a positive integer.');

  return input.programs
    .map((program) => {
      validateProgram(program);
      return roiForProgram(program, fallbackMonthlySpendKr, 0);
    })
    .sort((left, right) => {
      if (right.netKrBackPerKr !== left.netKrBackPerKr) return right.netKrBackPerKr - left.netKrBackPerKr;
      if (right.monthlyNetValueKr !== left.monthlyNetValueKr) return right.monthlyNetValueKr - left.monthlyNetValueKr;
      return left.programName.localeCompare(right.programName);
    })
    .slice(0, topN)
    .map((program, index) => ({ ...program, rank: index + 1 }));
}

export default rankLoyaltyProgramROI;
