import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('categories')
@Controller('categories')
export class CategoriesController {
  @Get(':category/market')
  @ApiOkResponse({ description: 'Category market report with verified price and deal evidence' })
  market(@Param('category') category: string) {
    const report = groceryApi.getCategoryMarket(category);
    if (!report) throw new NotFoundException('Category market not found');
    return { ...report, demo: true };
  }
}
