import {
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { DealScore } from '@groceryview/api-contracts';

const CONFIDENCE_LABELS = {
  low: 1,
  medium: 2,
  high: 3,
} as const;

export class DealScoreResponse implements DealScore {
  productSlug!: string;
  score!: number;
  verdict!: 'stock_up' | 'buy_now' | 'compare' | 'wait' | 'not_a_real_deal';
  discountVsMedian!: number;
  historicalPercentile!: number;
  confidenceLabel!: 'verified' | 'high' | 'medium' | 'low' | 'estimated';
  reasons!: string[];
  demo!: true;
}

interface DealScoreInputs {
  productSlug: string;
  bestPrice: number;
  medianPrice: number;
  historicalPercentile: number;
  confidenceRank: 'low' | 'medium' | 'high';
}

export function calculateDealScore({
  bestPrice,
  medianPrice,
  historicalPercentile,
  confidenceRank,
}: DealScoreInputs): Omit<DealScore, 'productSlug' | 'reasons' | 'demo'> {
  const discountVsMedian = Number(
    (((medianPrice - bestPrice) / medianPrice) * 100).toFixed(2),
  );

  const boundedPercentile = Math.max(
    1,
    Math.min(99, Math.round(historicalPercentile)),
  );

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        55 +
          discountVsMedian * 1.5 +
          (boundedPercentile - 50) * 0.2 +
          (CONFIDENCE_LABELS[confidenceRank] - 2) * 2,
      ),
    ),
  );

  let verdict: DealScore['verdict'] = 'not_a_real_deal';
  if (discountVsMedian <= -5) {
    verdict = 'wait';
  } else if (discountVsMedian < 1) {
    verdict = 'compare';
  } else if (discountVsMedian < 8) {
    verdict = 'buy_now';
  } else {
    verdict = 'stock_up';
  }

  const confidenceLabel = (() => {
    if (confidenceRank === 'high') {
      return 'high' as const;
    }
    if (confidenceRank === 'medium') {
      return 'medium' as const;
    }
    return 'low' as const;
  })();

  return {
    score,
    verdict,
    discountVsMedian,
    historicalPercentile: boundedPercentile,
    confidenceLabel,
  };
}

const DEAL_SCORE_SEEDS: Record<
  string,
  Pick<DealScoreInputs, 'bestPrice' | 'medianPrice' | 'historicalPercentile' | 'confidenceRank'>
> = {
  'zoegas-skane-mellanrost-450g': {
    bestPrice: 49.9,
    medianPrice: 62.5,
    historicalPercentile: 83,
    confidenceRank: 'high',
  },
  'oatly-ikaffe-1l': {
    bestPrice: 17.5,
    medianPrice: 19.0,
    historicalPercentile: 71,
    confidenceRank: 'medium',
  },
};

function buildDealScore(slug: string): DealScoreResponse {
  const seed = DEAL_SCORE_SEEDS[slug] ?? {
    bestPrice: 99,
    medianPrice: 100,
    historicalPercentile: 50,
    confidenceRank: 'low' as const,
  };

  const scoreData = calculateDealScore({ productSlug: slug, ...seed });
  const reasons = [
    `Discount vs median: ${scoreData.discountVsMedian.toFixed(1)}%.`,
    `Current price ranks in ${scoreData.historicalPercentile}th historical percentile.`,
  ];

  if (scoreData.verdict === 'stock_up') {
    reasons.push('Price is substantially below market median.');
  } else if (scoreData.verdict === 'buy_now') {
    reasons.push('Price is below median and suitable for purchase.');
  } else if (scoreData.verdict === 'compare') {
    reasons.push('Price is close to median; compare in nearby stores.');
  } else if (scoreData.verdict === 'wait') {
    reasons.push('Price is above median; likely not an urgent buy.');
  } else {
    reasons.push('Signal quality is insufficient for a confident recommendation.');
  }

  return {
    productSlug: slug,
    ...scoreData,
    reasons,
    demo: true,
  };
}

@ApiTags('dealscore')
@Controller('products')
export class DealscoreController {
  @Get(':slug/deal-score')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiQuery({
    name: 'distanceKm',
    required: false,
    description: 'Ignored in scoring: distance does not affect default deal score.',
  })
  @ApiOkResponse({ type: DealScoreResponse })
  getForProduct(
    @Param('slug') slug: string,
    @Query('distanceKm') _distanceKm?: string,
  ): DealScoreResponse {
    return buildDealScore(slug);
  }
}
