import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import {
  realBrandPriceIndicesEndpoint,
  realCategoryPriceIndicesEndpoint,
  realChainPriceIndicesEndpoint
} from '@groceryview/api';
import { groceryApi } from '../demo-data.js';
import { IndicesService } from './indices.service.js';

@ApiTags('market')
@Controller('indices')
export class IndicesController {
  constructor(private readonly indicesService: IndicesService) {}

  @Get()
  @ApiOkResponse({ description: 'List grocery indices' })
  list() {
    return groceryApi.getIndices().map((index) => ({ ...index, demo: true }));
  }

  @Get(realChainPriceIndicesEndpoint.actionPath)
  @ApiOkResponse({ description: 'Current chain price indices from observed product prices' })
  async chains() {
    return this.indicesService.getChainPriceIndices();
  }

  @Get(realCategoryPriceIndicesEndpoint.actionPath)
  @ApiOkResponse({ description: 'Category price indices from product price history and current prices' })
  async categories() {
    return this.indicesService.getCategoryPriceIndices();
  }

  @Get(realBrandPriceIndicesEndpoint.actionPath)
  @ApiOkResponse({ description: 'Brand-tier price indices from product price history and current prices' })
  async brands() {
    return this.indicesService.getBrandPriceIndices();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Grocery index detail' })
  detail(@Param('id') id: string) {
    const index = groceryApi.getIndex(id);
    if (!index) throw new NotFoundException('Index not found');
    return { ...index, demo: true };
  }
}
