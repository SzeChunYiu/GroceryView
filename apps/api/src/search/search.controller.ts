import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { searchRoutes } from '../routes/search.js';
import { RealCatalogService } from '../real-catalog/real-catalog.service.js';

@ApiTags('search')
@Controller(['search', 'api/search'])
export class SearchController {
  constructor(private readonly realCatalog: RealCatalogService) {}

  @Get('suggest')
  @ApiOkResponse({ description: searchRoutes.suggestDescription })
  suggest(@Query('q') q?: string, @Query('limit') limit?: string) {
    return this.realCatalog.suggestProducts({ q, limit });
  }
}

