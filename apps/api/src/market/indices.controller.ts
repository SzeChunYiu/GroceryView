import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  realBrandPriceIndicesEndpoint,
  realCategoryPriceIndicesEndpoint,
  realChainPriceIndicesEndpoint
} from '@groceryview/api';
import { jsonArrayResponse, param } from '../openapi.js';
import { groceryApi } from '../demo-data.js';
import { IndicesService } from './indices.service.js';

@ApiTags('market')
@Controller('indices')
export class IndicesController {
  constructor(private readonly indicesService: IndicesService) {}

  @Get()
  @jsonArrayResponse('List grocery indices')
  list() {
    return groceryApi.getIndices().map((index) => ({ ...index, demo: true }));
  }

  @Get(realChainPriceIndicesEndpoint.actionPath)
  @jsonArrayResponse('Current chain price indices from observed product prices')
  async chains() {
    return this.indicesService.getChainPriceIndices();
  }

  @Get(realCategoryPriceIndicesEndpoint.actionPath)
  @jsonArrayResponse('Category price indices from product price history and current prices')
  async categories() {
    return this.indicesService.getCategoryPriceIndices();
  }

  @Get(realBrandPriceIndicesEndpoint.actionPath)
  @jsonArrayResponse('Brand-tier price indices from product price history and current prices')
  async brands() {
    return this.indicesService.getBrandPriceIndices();
  }

  @Get(':id')
  @param('id', true, 'Index identifier used for detailed market metric.')
  @jsonResponse('Grocery index detail')
  detail(@Param('id') id: string) {
    const index = groceryApi.getIndex(id);
    if (!index) throw new NotFoundException('Index not found');
    return { ...index, demo: true };
  }
}
