import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { categoriesRoute } from '../routes/categories.js';

@ApiTags('categories')
@Controller(categoriesRoute.controllerPath)
export class CategoriesController {
  @Get()
  @ApiOkResponse({ description: categoriesRoute.listDescription })
  list(@Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, categoriesRoute.queryParams, categoriesRoute.controllerPath);
    return groceryApi.getCategories();
  }

  @Get(':category/market')
  @ApiOkResponse({ description: categoriesRoute.marketDescription })
  market(@Param('category') category: string) {
    const report = groceryApi.getCategoryMarket(category);
    if (!report) throw new NotFoundException('Category market not found');
    return { ...report, demo: true };
  }
}
