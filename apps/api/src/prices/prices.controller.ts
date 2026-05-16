import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export class PriceObservationDto {
  productSlug!: string;
  storeSlug!: string;
  priceAmount!: number;
  currency!: 'SEK';
  unit!: string;
  observedAt!: string;
  priceType!: 'regular' | 'promotion' | 'member';
  confidenceScore!: number;
  sourceType!: string;
  demo!: true;
}

export class PriceSeriesPointDto {
  timestamp!: string;
  value!: number;
  currency!: 'SEK';
  priceType!: 'regular' | 'promotion' | 'member';
  confidenceScore!: number;
  demo!: true;
}

const OBSERVED_AT = '2026-05-16T10:00:00.000Z';

function buildPriceObservation(productSlug: string): PriceObservationDto {
  return {
    productSlug,
    storeSlug: 'ica-nara-odenplan',
    priceAmount: 49.9,
    currency: 'SEK',
    unit: 'package',
    observedAt: OBSERVED_AT,
    priceType: 'promotion',
    confidenceScore: 0.86,
    sourceType: 'seed/demo',
    demo: true,
  };
}

@Controller('products/:slug')
@ApiTags('prices')
export class PricesController {
  @Get('prices')
  @ApiOperation({ summary: 'List demo latest prices for a product' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: PriceObservationDto, isArray: true })
  listProductPrices(@Param('slug') slug: string): PriceObservationDto[] {
    return [buildPriceObservation(slug)];
  }

  @Get('series')
  @ApiOperation({ summary: 'List demo chart series points for a product' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: PriceSeriesPointDto, isArray: true })
  listProductSeries(@Param('slug') slug: string): PriceSeriesPointDto[] {
    const observation = buildPriceObservation(slug);

    return [
      {
        timestamp: '2026-05-09T10:00:00.000Z',
        value: 59.9,
        currency: observation.currency,
        priceType: 'regular',
        confidenceScore: 0.8,
        demo: true,
      },
      {
        timestamp: observation.observedAt,
        value: observation.priceAmount,
        currency: observation.currency,
        priceType: observation.priceType,
        confidenceScore: observation.confidenceScore,
        demo: true,
      },
    ];
  }
}
