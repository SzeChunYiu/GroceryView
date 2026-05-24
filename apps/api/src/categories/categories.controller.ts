import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { jsonResponse, param } from '../openapi.js';
import { groceryApi } from '../demo-data.js';
import { validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { categoriesRoute } from '../routes/categories.js';

@ApiTags('categories')
@Controller(categoriesRoute.controllerPath)
export class CategoriesController {
  @Get()
  @jsonResponse(categoriesRoute.listDescription)
  list(@Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, categoriesRoute.queryParams, categoriesRoute.controllerPath);
    return groceryApi.getCategories();
  }

  @Get(':category/market')
  @jsonResponse(categoriesRoute.marketDescription)
  @param('category', true, 'Category slug segment used to resolve market evidence.')
  market(@Param('category') category: string) {
    const report = groceryApi.getCategoryMarket(category);
    if (!report) throw new NotFoundException('Category market not found');
    return { ...report, demo: true };
  }
}
