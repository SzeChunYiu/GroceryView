import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { ProductSummary } from '@groceryview/api-contracts';

export class ProductSummaryResponse implements ProductSummary {
  id!: string;
  slug!: string;
  name!: string;
  brand!: string;
  category!: string;
  unit!: string;
  currency!: 'SEK';
  currentBestPrice!: number;
  currentBestStore!: string;
  dealScore!: number;
  lastObservedAt!: string;
  demo!: true;
}

export class ProductDetailResponse extends ProductSummaryResponse {
  description!: string;
  equivalentProductSlugs!: string[];
  watchedByDemoUser!: boolean;
}

const DEMO_PRODUCTS: ProductSummaryResponse[] = [
  {
    id: 'demo-product-zoegas-skane-450g',
    slug: 'zoegas-skane-mellanrost-450g',
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
  },
  {
    id: 'demo-product-oatly-ikaffe-1l',
    slug: 'oatly-ikaffe-1l',
    name: 'Oatly iKaffe 1L',
    brand: 'Oatly',
    category: 'dairy-alternatives',
    unit: 'liter',
    currency: 'SEK',
    currentBestPrice: 17.5,
    currentBestStore: 'ICA Kvantum Liljeholmen',
    dealScore: 72,
    lastObservedAt: '2026-05-16T08:45:00.000Z',
    demo: true,
  },
];

const DEFAULT_PRODUCT = DEMO_PRODUCTS[0]!;

@ApiTags('products')
@Controller('products')
export class ProductsController {
  @Get()
  @ApiOkResponse({ type: ProductSummaryResponse, isArray: true })
  findAll(): ProductSummaryResponse[] {
    return DEMO_PRODUCTS;
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: ProductDetailResponse })
  findOne(@Param('slug') slug: string): ProductDetailResponse {
    const product =
      DEMO_PRODUCTS.find((candidate) => candidate.slug === slug) ??
      DEFAULT_PRODUCT;

    return {
      ...product,
      description:
        'Seed/demo product response for early GroceryView client integration.',
      equivalentProductSlugs: ['gevalia-mellanrost-450g'],
      watchedByDemoUser: product.slug === 'zoegas-skane-mellanrost-450g',
    };
  }
}
