export type PriceAlertInput = {
  productId: string;
  productName: string;
  targetPrice: number;
  currentPrice: number;
  wasTriggered?: boolean;
};

export type AlertEvaluatorResult =
  | {
      status: 'triggered';
      reason: 'price_drops_to_target' | 'price_drops_below_target';
      severity: 'opportunity' | 'urgent';
      message: string;
    }
  | {
      status: 'not_triggered';
      reason: 'price_rises';
      message: string;
    }
  | {
      status: 'already_triggered';
      reason: 'already_triggered';
      message: string;
    };

export type PriceAlertResult = {
  productId: string;
  productName: string;
  targetPrice: number;
  evaluatedAtPrice: number;
  outcome: AlertEvaluatorResult;
};

const formatMoney = (value: number) => `${value.toFixed(2)} SEK`;

export function evaluatePriceAlert(input: PriceAlertInput): PriceAlertResult {
  const roundedCurrent = Math.round(input.currentPrice * 100) / 100;
  const roundedTarget = Math.round(input.targetPrice * 100) / 100;

  if (input.wasTriggered) {
    return {
      productId: input.productId,
      productName: input.productName,
      targetPrice: roundedTarget,
      evaluatedAtPrice: roundedCurrent,
      outcome: {
        status: 'already_triggered',
        reason: 'already_triggered',
        message: `${input.productName} alert already sent for ${input.targetPrice} SEK target.`
      }
    };
  }

  if (roundedCurrent > roundedTarget) {
    return {
      productId: input.productId,
      productName: input.productName,
      targetPrice: roundedTarget,
      evaluatedAtPrice: roundedCurrent,
      outcome: {
        status: 'not_triggered',
        reason: 'price_rises',
        message: `${input.productName} is ${formatMoney(roundedCurrent)}, above target ${formatMoney(roundedTarget)}.`
      }
    };
  }

  if (roundedCurrent === roundedTarget) {
    return {
      productId: input.productId,
      productName: input.productName,
      targetPrice: roundedTarget,
      evaluatedAtPrice: roundedCurrent,
      outcome: {
        status: 'triggered',
        reason: 'price_drops_to_target',
        severity: 'opportunity',
        message: `${input.productName} reached target price ${formatMoney(roundedTarget)}.`
      }
    };
  }

  return {
    productId: input.productId,
    productName: input.productName,
    targetPrice: roundedTarget,
    evaluatedAtPrice: roundedCurrent,
    outcome: {
      status: 'triggered',
      reason: 'price_drops_below_target',
      severity: 'urgent',
      message: `${input.productName} dropped below target at ${formatMoney(roundedCurrent)}.`
    }
  };
}
