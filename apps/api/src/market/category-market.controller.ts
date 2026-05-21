import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('market')
@Controller('categories')
export class CategoryMarketController {
  @Get(':category/market')
  @ApiOkResponse({ description: 'Category market report with verified price evidence' })
  market(@Param('category') category: string) {
    const report = groceryApi.getCategoryMarket(category);
    if (!report) throw new NotFoundException('Category not found');
    return { ...report, demo: true };
  }
}
