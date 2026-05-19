import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  PriceObservation,
  PriceProvenance,
  PriceSeriesPoint,
  ProductPriceSeries,
} from '@groceryview/api-contracts';

export class PriceObservationResponse implements PriceObservation {
  id!: string;
  productSlug!: string;
  storeSlug!: string;
  priceAmount!: number;
  currency!: 'SEK';
  unit!: string;
  unitPriceAmount!: number | null;
  unitPriceUnit!: string | null;
  priceType!: 'regular' | 'promotion' | 'member';
  observedAt!: string;
  sourceType!: 'retailer_page';
  confidence!: number;
  confidenceLabel!: 'high';
  provenance!: PriceProvenance;
  memberOnly!: boolean;
  promotionLabel!: string | null;
  validFrom!: string | null;
  validTo!: string | null;
  demo!: true;
}

export class PriceSeriesPointResponse implements PriceSeriesPoint {
  timestamp!: string;
  value!: number;
  priceType!: 'regular' | 'promotion' | 'member';
  confidence!: number;
  confidenceLabel!: 'high';
  style!: 'solid' | 'dotted';
  sourceType!: 'retailer_page';
  provenance!: PriceProvenance;
}

export class ProductPriceSeriesResponse implements ProductPriceSeries {
  productSlug!: string;
  range!: '90d';
  currency!: 'SEK';
  unit!: string;
  series!: PriceSeriesPointResponse[];
  demo!: true;
}

function demoProvenance(
  productSlug: string,
  storeSlug: string,
  observedAt: string,
): PriceProvenance {
  return {
    sourceType: 'retailer_page',
    sourceName: `${storeSlug} demo retailer page`,
    sourceRunId: `demo-run-${productSlug}-${storeSlug}`,
    sourceUrl: `https://example.com/demo/${storeSlug}/${productSlug}`,
    rawRecordId: `demo-raw-${productSlug}-${storeSlug}`,
    rawSnapshotRef: `s3://groceryview-raw/demo/${storeSlug}/${productSlug}.json`,
    fetchedAt: observedAt,
    observedAt,
    parserVersion: 'demo-v1',
  };
}

function demoPriceObservations(
  productSlug: string,
): PriceObservationResponse[] {
  return [
    {
      id: `demo-price-${productSlug}-willys-odenplan`,
      productSlug,
      storeSlug: 'willys-odenplan',
      priceAmount: 49.9,
      currency: 'SEK',
      unit: 'package',
      unitPriceAmount: 110.89,
      unitPriceUnit: 'kg',
      priceType: 'promotion',
      observedAt: '2026-05-16T09:30:00.000Z',
      sourceType: 'retailer_page',
      confidence: 0.89,
      confidenceLabel: 'high',
      provenance: demoProvenance(
        productSlug,
        'willys-odenplan',
        '2026-05-16T09:30:00.000Z',
      ),
      memberOnly: false,
      promotionLabel: 'Demo campaign',
      validFrom: null,
      validTo: null,
      demo: true,
    },
    {
      id: `demo-price-${productSlug}-ica-kvantum-liljeholmen`,
      productSlug,
      storeSlug: 'ica-kvantum-liljeholmen',
      priceAmount: 54.9,
      currency: 'SEK',
      unit: 'package',
      unitPriceAmount: 122,
      unitPriceUnit: 'kg',
      priceType: 'regular',
      observedAt: '2026-05-16T08:45:00.000Z',
      sourceType: 'retailer_page',
      confidence: 0.86,
      confidenceLabel: 'high',
      provenance: demoProvenance(
        productSlug,
        'ica-kvantum-liljeholmen',
        '2026-05-16T08:45:00.000Z',
      ),
      memberOnly: false,
      promotionLabel: null,
      validFrom: null,
      validTo: null,
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
          confidenceLabel: 'high',
          style: 'solid',
          sourceType: 'retailer_page',
          provenance: demoProvenance(
            slug,
            'willys-odenplan',
            '2026-05-13T00:00:00.000Z',
          ),
        },
        {
          timestamp: '2026-05-16T00:00:00.000Z',
          value: 49.9,
          priceType: 'promotion',
          confidence: 0.89,
          confidenceLabel: 'high',
          style: 'solid',
          sourceType: 'retailer_page',
          provenance: demoProvenance(
            slug,
            'willys-odenplan',
            '2026-05-16T00:00:00.000Z',
          ),
        },
      ],
      demo: true,
    };
  }
}
