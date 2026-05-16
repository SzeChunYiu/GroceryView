import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

interface PriceObservationResponse {
  id: string;
  productSlug: string;
  storeSlug: string;
  storeName: string;
  chain: string;
  priceAmount: number;
  currency: 'SEK';
  unit: string;
  priceType: 'regular' | 'promotion' | 'member';
  observedAt: string;
  validFrom: string;
  validTo: string | null;
  sourceType: 'seed_demo';
  confidenceScore: number;
}

interface PriceSeriesPoint {
  timestamp: string;
  value: number;
  priceType: 'regular' | 'promotion' | 'member';
  confidence: number;
  style: 'solid' | 'dotted';
  sourceType: 'seed_demo';
}

interface ProductPriceSeriesResponse {
  instrument: {
    slug: string;
    type: 'product';
    symbol: string;
  };
  range: '90d';
  currency: 'SEK';
  unit: string;
  series: PriceSeriesPoint[];
  markers: Array<{
    timestamp: string;
    type: 'promotion';
    label: string;
  }>;
}

const demoObservations: PriceObservationResponse[] = [
  {
    id: 'price_zoegas_willys_20260516',
    productSlug: 'zoegas-skane-450g',
    storeSlug: 'willys-odenplan',
    storeName: 'Willys Odenplan',
    chain: 'Willys',
    priceAmount: 49.9,
    currency: 'SEK',
    unit: 'package',
    priceType: 'promotion',
    observedAt: '2026-05-16T08:00:00.000Z',
    validFrom: '2026-05-13T00:00:00.000Z',
    validTo: '2026-05-19T21:59:59.000Z',
    sourceType: 'seed_demo',
    confidenceScore: 0.91,
  },
  {
    id: 'price_zoegas_ica_20260516',
    productSlug: 'zoegas-skane-450g',
    storeSlug: 'ica-kvantum-liljeholmen',
    storeName: 'ICA Kvantum Liljeholmen',
    chain: 'ICA',
    priceAmount: 64.9,
    currency: 'SEK',
    unit: 'package',
    priceType: 'regular',
    observedAt: '2026-05-16T07:30:00.000Z',
    validFrom: '2026-05-16T00:00:00.000Z',
    validTo: null,
    sourceType: 'seed_demo',
    confidenceScore: 0.88,
  },
];

@Controller()
@ApiTags('prices')
export class PricesController {
  @Get('products/:slug/prices')
  @ApiOperation({ summary: 'List demo current prices for a product' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-450g' })
  listProductPrices(@Param('slug') slug: string): PriceObservationResponse[] {
    const observations = demoObservations.filter(
      (observation) => observation.productSlug === slug,
    );

    return observations.length > 0 ? observations : demoObservations;
  }

  @Get('products/:slug/series')
  @ApiOperation({ summary: 'Get a demo 90-day product price series' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-450g' })
  getProductSeries(@Param('slug') slug: string): ProductPriceSeriesResponse {
    return {
      instrument: {
        slug,
        type: 'product',
        symbol: slug.toUpperCase().replaceAll('-', '_'),
      },
      range: '90d',
      currency: 'SEK',
      unit: 'package',
      series: [
        {
          timestamp: '2026-03-01T00:00:00.000Z',
          value: 69.9,
          priceType: 'regular',
          confidence: 0.82,
          style: 'solid',
          sourceType: 'seed_demo',
        },
        {
          timestamp: '2026-04-01T00:00:00.000Z',
          value: 59.9,
          priceType: 'member',
          confidence: 0.8,
          style: 'dotted',
          sourceType: 'seed_demo',
        },
        {
          timestamp: '2026-05-16T08:00:00.000Z',
          value: 49.9,
          priceType: 'promotion',
          confidence: 0.91,
          style: 'solid',
          sourceType: 'seed_demo',
        },
      ],
      markers: [
        {
          timestamp: '2026-05-13T00:00:00.000Z',
          type: 'promotion',
          label: 'Willys campaign price',
        },
      ],
    };
  }
}
