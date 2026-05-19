import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type {
  ConfidenceLabel,
  LatestStorePrice,
  PriceObservation,
  ProductSummary,
  ProductTerminalData,
  PromotionObservation,
} from '@groceryview/api-contracts';

type PriceType = 'regular' | 'promotion' | 'member';

export class PriceObservationResponse implements PriceObservation {
  id!: string;
  productSlug!: string;
  storeSlug!: string;
  priceAmount!: number;
  currency!: 'SEK';
  unit!: string;
  priceType!: PriceType;
  observedAt!: string;
  sourceType!: string;
  provenance!: string;
  confidenceScore!: number;
  confidenceLabel!: ConfidenceLabel;
  demo!: true;
}

export class LatestStorePriceResponse implements LatestStorePrice {
  productSlug!: string;
  storeSlug!: string;
  storeName!: string;
  priceAmount!: number;
  currency!: 'SEK';
  unit!: string;
  unitPriceAmount!: number;
  unitPriceUnit!: string;
  priceType!: PriceType;
  observedAt!: string;
  sourceType!: string;
  provenance!: string;
  confidenceScore!: number;
  confidenceLabel!: ConfidenceLabel;
  demo!: true;
}

export class PromotionObservationResponse implements PromotionObservation {
  id!: string;
  productSlug!: string;
  storeSlug!: string;
  priceAmount!: number;
  regularPriceAmount!: number;
  discountPercent!: number;
  currency!: 'SEK';
  unit!: string;
  startsAt!: string | null;
  endsAt!: string | null;
  observedAt!: string;
  sourceType!: string;
  provenance!: string;
  confidenceScore!: number;
  confidenceLabel!: ConfidenceLabel;
  demo!: true;
}

export class ProductTerminalDataResponse implements ProductTerminalData {
  product!: ProductSummary;
  latestPrices!: LatestStorePriceResponse[];
  priceObservations!: PriceObservationResponse[];
  promotionObservations!: PromotionObservationResponse[];
  generatedAt!: string;
  demo!: true;
}

export class PriceSeriesPointResponse {
  timestamp!: string;
  value!: number;
  priceType!: PriceType;
  confidence!: number;
  style!: 'solid' | 'dotted';
  sourceType!: string;
  provenance!: string;
  confidenceLabel!: ConfidenceLabel;
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
  return [
    {
      id: `demo-price-${productSlug}-willys-odenplan`,
      productSlug,
      storeSlug: 'willys-odenplan',
      priceAmount: 49.9,
      currency: 'SEK',
      unit: 'package',
      priceType: 'promotion',
      observedAt: '2026-05-16T09:30:00.000Z',
      sourceType: 'retailer_page',
      provenance:
        'https://www.willys.se/sortiment/kaffe-te-och-kakao/kaffe/zoegas-skane-mellanrost-101234567_ST',
      confidenceScore: 0.89,
      confidenceLabel: 'high',
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
      provenance:
        'https://handla.ica.se/produkt/zoegas-skane-mellanrost-450g-101234567',
      confidenceScore: 0.86,
      confidenceLabel: 'high',
      demo: true,
    },
    {
      id: `demo-price-${productSlug}-coop-medborgarplatsen-member`,
      productSlug,
      storeSlug: 'coop-medborgarplatsen',
      priceAmount: 51.9,
      currency: 'SEK',
      unit: 'package',
      priceType: 'member',
      observedAt: '2026-05-15T14:10:00.000Z',
      sourceType: 'retailer_page',
      provenance:
        'https://www.coop.se/handla/varor/kaffe-te-kakao/kaffe/mellanrost/zoegas-skane-mellanrost-101234567',
      confidenceScore: 0.74,
      confidenceLabel: 'medium',
      demo: true,
    },
  ];
}

function demoLatestPrices(productSlug: string): LatestStorePriceResponse[] {
  return [
    {
      productSlug,
      storeSlug: 'willys-odenplan',
      storeName: 'Willys Odenplan',
      priceAmount: 49.9,
      currency: 'SEK',
      unit: 'package',
      unitPriceAmount: 110.89,
      unitPriceUnit: 'kg',
      priceType: 'promotion',
      observedAt: '2026-05-16T09:30:00.000Z',
      sourceType: 'retailer_page',
      provenance:
        'https://www.willys.se/sortiment/kaffe-te-och-kakao/kaffe/zoegas-skane-mellanrost-101234567_ST',
      confidenceScore: 0.89,
      confidenceLabel: 'high',
      demo: true,
    },
    {
      productSlug,
      storeSlug: 'ica-kvantum-liljeholmen',
      storeName: 'ICA Kvantum Liljeholmen',
      priceAmount: 54.9,
      currency: 'SEK',
      unit: 'package',
      unitPriceAmount: 122.0,
      unitPriceUnit: 'kg',
      priceType: 'regular',
      observedAt: '2026-05-16T08:45:00.000Z',
      sourceType: 'retailer_page',
      provenance:
        'https://handla.ica.se/produkt/zoegas-skane-mellanrost-450g-101234567',
      confidenceScore: 0.86,
      confidenceLabel: 'high',
      demo: true,
    },
  ];
}

function demoPromotionObservations(
  productSlug: string,
): PromotionObservationResponse[] {
  return [
    {
      id: `demo-promo-${productSlug}-willys-odenplan`,
      productSlug,
      storeSlug: 'willys-odenplan',
      priceAmount: 49.9,
      regularPriceAmount: 59.9,
      discountPercent: 16.69,
      currency: 'SEK',
      unit: 'package',
      startsAt: '2026-05-13T00:00:00.000Z',
      endsAt: '2026-05-19T21:59:59.000Z',
      observedAt: '2026-05-16T09:30:00.000Z',
      sourceType: 'retailer_page',
      provenance:
        'https://www.willys.se/sortiment/kaffe-te-och-kakao/kaffe/zoegas-skane-mellanrost-101234567_ST',
      confidenceScore: 0.89,
      confidenceLabel: 'high',
      demo: true,
    },
  ];
}

function demoProduct(productSlug: string): ProductSummary {
  return {
    id: `demo-product-${productSlug}`,
    slug: productSlug,
    name: 'Zoégas Skåne Mellanrost 450g',
    brand: 'Zoégas',
    category: 'coffee',
    unit: 'package',
    currency: 'SEK',
    currentBestPrice: 49.9,
    currentBestStore: 'Willys Odenplan',
    dealScore: 86,
    lastObservedAt: '2026-05-16T09:30:00.000Z',
    demo: true,
  };
}

@ApiTags('prices')
@Controller('products/:slug')
export class PricesController {
  @Get('terminal')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: ProductTerminalDataResponse })
  findTerminalData(@Param('slug') slug: string): ProductTerminalDataResponse {
    return {
      product: demoProduct(slug),
      latestPrices: demoLatestPrices(slug),
      priceObservations: demoPriceObservations(slug),
      promotionObservations: demoPromotionObservations(slug),
      generatedAt: '2026-05-16T10:00:00.000Z',
      demo: true,
    };
  }

  @Get('latest-prices')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: LatestStorePriceResponse, isArray: true })
  findLatestPrices(@Param('slug') slug: string): LatestStorePriceResponse[] {
    return demoLatestPrices(slug);
  }

  @Get('prices')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: PriceObservationResponse, isArray: true })
  findPrices(@Param('slug') slug: string): PriceObservationResponse[] {
    return demoPriceObservations(slug);
  }

  @Get('promotions')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: PromotionObservationResponse, isArray: true })
  findPromotions(
    @Param('slug') slug: string,
  ): PromotionObservationResponse[] {
    return demoPromotionObservations(slug);
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
          provenance:
            'https://handla.ica.se/produkt/zoegas-skane-mellanrost-450g-101234567',
          confidenceLabel: 'high',
        },
        {
          timestamp: '2026-05-16T00:00:00.000Z',
          value: 49.9,
          priceType: 'promotion',
          confidence: 0.89,
          style: 'solid',
          sourceType: 'retailer_page',
          provenance:
            'https://www.willys.se/sortiment/kaffe-te-och-kakao/kaffe/zoegas-skane-mellanrost-101234567_ST',
          confidenceLabel: 'high',
        },
      ],
      demo: true,
    };
  }
}
