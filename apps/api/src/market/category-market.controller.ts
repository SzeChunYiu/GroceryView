import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, param } from '../openapi.js';
import { groceryApi } from '../demo-data.js';

@ApiTags('market')
@Controller('categories')
export class CategoryMarketController {
  @Get(':category/market')
  @param('category', true, 'Category slug used to pull market report.')
  @jsonResponse('Category market report with verified price evidence')
  market(@Param('category') category: string) {
    const report = groceryApi.getCategoryMarket(category);
    if (!report) throw new NotFoundException('Category not found');
    return { ...report, demo: true };
  }
}
