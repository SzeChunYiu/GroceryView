import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('market')
@Controller('indices')
export class IndicesController {
  @Get()
  @ApiOkResponse({ description: 'List grocery indices' })
  list() {
    return groceryApi.getIndices().map((index) => ({ ...index, demo: true }));
  }

  @Get('chains')
  @ApiOkResponse({ description: 'Current chain price indices from observed product prices' })
  chains() {
    return { ...groceryApi.getChainPriceIndices(), demo: true };
  }

  @Get('categories')
  @ApiOkResponse({ description: 'Category price indices from product price history and current prices' })
  categories() {
    return { ...groceryApi.getCategoryPriceIndices(), demo: true };
  }

  @Get('brands')
  @ApiOkResponse({ description: 'Brand-tier price indices from product price history and current prices' })
  brands() {
    return { ...groceryApi.getBrandPriceIndices(), demo: true };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Grocery index detail' })
  detail(@Param('id') id: string) {
    const index = groceryApi.getIndex(id);
    if (!index) throw new NotFoundException('Index not found');
    return { ...index, demo: true };
  }
}
