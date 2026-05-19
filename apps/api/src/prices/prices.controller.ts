import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { PriceObservation } from '@groceryview/api-contracts';

type PriceConfidence = PriceObservation['confidence'];
type PriceProvenance = PriceObservation['provenance'];
type PriceSourceType = PriceObservation['sourceType'];
type PriceType = PriceObservation['priceType'];

export class PriceObservationResponse implements PriceObservation {
  id!: string;
  productSlug!: string;
  storeSlug!: string;
  priceAmount!: number;
  currency!: 'SEK';
  unit!: string;
  priceType!: PriceType;
  observedAt!: string;
  sourceType!: PriceSourceType;
  confidence!: PriceConfidence;
  provenance!: PriceProvenance;
  demo!: true;
}

export class PriceSeriesPointResponse {
  timestamp!: string;
  value!: number;
  priceType!: 'regular' | 'promotion' | 'member';
  confidence!: number;
  style!: 'solid' | 'dotted';
  sourceType!: string;
}

export class ProductPriceSeriesResponse {
  productSlug!: string;
  range!: '90d';
  currency!: 'SEK';
  unit!: string;
  series!: PriceSeriesPointResponse[];
  demo!: true;
}

function demoPriceObservations(
  productSlug: string,
): PriceObservationResponse[] {
  const observedAt = '2026-05-16T09:30:00.000Z';

  return [
    {
      id: `demo-price-${productSlug}-willys-odenplan`,
      productSlug,
      storeSlug: 'willys-odenplan',
      priceAmount: 49.9,
      currency: 'SEK',
      unit: 'package',
      priceType: 'promotion',
      observedAt,
      sourceType: 'retailer_page',
      confidence: {
        score: 0.89,
        label: 'high',
      },
      provenance: {
        sourceUrl: 'https://example.test/willys/zoegas-skane-mellanrost-450g',
        sourceType: 'retailer_page',
        observedAt,
        parserVersion: 'demo-parser-v1',
        rawSnapshotRef: `demo://retailer/willys/${productSlug}/2026-05-16T09:30:00.000Z`,
      },
      demo: true,
    },
    {
      id: `demo-price-${productSlug}-ica-kvantum-liljeholmen`,
      productSlug,
      storeSlug: 'ica-kvantum-liljeholmen',
      priceAmount: 54.9,
      currency: 'SEK',
      unit: 'package',
      priceType: 'regular',
      observedAt: '2026-05-16T08:45:00.000Z',
      sourceType: 'retailer_page',
      confidence: {
        score: 0.86,
        label: 'high',
      },
      provenance: {
        sourceUrl: 'https://example.test/ica/zoegas-skane-mellanrost-450g',
        sourceType: 'retailer_page',
        observedAt: '2026-05-16T08:45:00.000Z',
        parserVersion: 'demo-parser-v1',
        rawSnapshotRef: `demo://retailer/ica/${productSlug}/2026-05-16T08:45:00.000Z`,
      },
      demo: true,
    },
  ];
}

@ApiTags('prices')
@Controller('products/:slug')
export class PricesController {
  @Get('prices')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: PriceObservationResponse, isArray: true })
  findPrices(@Param('slug') slug: string): PriceObservationResponse[] {
    return demoPriceObservations(slug);
  }

  @Get('series')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: ProductPriceSeriesResponse })
  findSeries(@Param('slug') slug: string): ProductPriceSeriesResponse {
    return {
      productSlug: slug,
      range: '90d',
      currency: 'SEK',
      unit: 'package',
      series: [
        {
          timestamp: '2026-05-13T00:00:00.000Z',
          value: 59.9,
          priceType: 'regular',
          confidence: 0.82,
          style: 'solid',
          sourceType: 'retailer_page',
        },
        {
          timestamp: '2026-05-16T00:00:00.000Z',
          value: 49.9,
          priceType: 'promotion',
          confidence: 0.89,
          style: 'solid',
          sourceType: 'retailer_page',
        },
      ],
      demo: true,
    };
  }
}
