import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export class ProductSummaryDto {
  slug!: string;
  name!: string;
  brand!: string;
  category!: string;
  unit!: string;
  demo!: true;
}

const PRODUCTS: ProductSummaryDto[] = [
  {
    slug: 'zoegas-skane-mellanrost-450g',
    name: 'Zoégas Skåne Mellanrost 450g',
    brand: 'Zoégas',
    category: 'coffee',
    unit: 'package',
    demo: true,
  },
  {
    slug: 'arla-mellanmjolk-1l',
    name: 'Arla Mellanmjölk 1L',
    brand: 'Arla',
    category: 'dairy',
    unit: 'liter',
    demo: true,
  },
];

@Controller('products')
@ApiTags('products')
export class ProductsController {
  @Get()
  @ApiOperation({ summary: 'List demo product summaries' })
  @ApiOkResponse({ type: ProductSummaryDto, isArray: true })
  listProducts(): ProductSummaryDto[] {
    return PRODUCTS;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a demo product summary by slug' })
  @ApiParam({ name: 'slug', example: 'zoegas-skane-mellanrost-450g' })
  @ApiOkResponse({ type: ProductSummaryDto })
  getProduct(@Param('slug') slug: string): ProductSummaryDto {
    return (
      PRODUCTS.find((product) => product.slug === slug) ?? {
        slug,
        name: 'Demo product placeholder',
        brand: 'Demo brand',
        category: 'demo',
        unit: 'package',
        demo: true,
      }
    );
  }
}
