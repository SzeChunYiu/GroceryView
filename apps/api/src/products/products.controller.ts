import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

interface ProductSummary {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: string;
  packageSize: string;
  unit: string;
  currency: 'SEK';
  currentBestPrice: number;
  currentBestStore: string;
  dealScore: number;
  dataStatus: 'seed_demo';
}

interface ProductDetail extends ProductSummary {
  barcode: string;
  aliases: string[];
  lastObservedAt: string;
  confidenceScore: number;
}

const primaryDemoProduct: ProductDetail = {
  id: 'prod_zoegas_skane_450g',
  slug: 'zoegas-skane-450g',
  name: 'Zoégas Skåne Mörkrost',
  brand: 'Zoégas',
  category: 'coffee',
  packageSize: '450 g',
  unit: 'package',
  currency: 'SEK',
  currentBestPrice: 49.9,
  currentBestStore: 'Willys Odenplan',
  dealScore: 82,
  dataStatus: 'seed_demo',
  barcode: '7310731103527',
  aliases: ['Zoegas Skane 450g', 'Zoégas Skånerost 450 g'],
  lastObservedAt: '2026-05-16T08:00:00.000Z',
  confidenceScore: 0.91,
};

const demoProducts: ProductDetail[] = [
  primaryDemoProduct,
  {
    id: 'prod_arla_mellanmjolk_1l',
    slug: 'arla-mellanmjolk-1l',
    name: 'Arla Mellanmjölk',
    brand: 'Arla',
    category: 'dairy',
    packageSize: '1 l',
    unit: 'liter',
    currency: 'SEK',
    currentBestPrice: 14.5,
    currentBestStore: 'ICA Kvantum Liljeholmen',
    dealScore: 61,
    dataStatus: 'seed_demo',
    barcode: '7310865001201',
    aliases: ['Arla mellanmjolk 1l', 'Arla milk 1 liter'],
    lastObservedAt: '2026-05-16T07:30:00.000Z',
    confidenceScore: 0.88,
  },
];

function toSummary(product: ProductDetail): ProductSummary {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    packageSize: product.packageSize,
    unit: product.unit,
    currency: product.currency,
    currentBestPrice: product.currentBestPrice,
    currentBestStore: product.currentBestStore,
    dealScore: product.dealScore,
    dataStatus: product.dataStatus,
  };
}

@Controller('products')
@ApiTags('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'List demo product summaries' })
  listProducts(): ProductSummary[] {
    return demoProducts.map(toSummary);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a demo product by slug' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-450g' })
  getProduct(@Param('slug') slug: string): ProductDetail {
    return (
      demoProducts.find((product) => product.slug === slug) ??
      primaryDemoProduct
    );
  }
}
