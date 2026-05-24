import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { compareRoutes } from '../routes/compare.js';
import { parseRequiredStringArrayQuery, validateNoUnexpectedQueryParameters } from '../middleware/validate.js';
import { CompareService } from './compare.service.js';

@ApiTags('compare')
@Controller(compareRoutes.controllerPath)
export class CompareController {
  constructor(private readonly compare: CompareService) {}

  @Get()
  @ApiOkResponse({ description: compareRoutes.itemSnapshotDescription })
  async priceSnapshots(@Query() query: Record<string, unknown>) {
    validateNoUnexpectedQueryParameters(query, [compareRoutes.itemIdsParam], compareRoutes.priceSnapshots);
    const itemIds = parseRequiredStringArrayQuery(query[compareRoutes.itemIdsParam], compareRoutes.itemIdsParam, compareRoutes.maxItems);
    return this.compare.priceSnapshots(itemIds);
  }
}
