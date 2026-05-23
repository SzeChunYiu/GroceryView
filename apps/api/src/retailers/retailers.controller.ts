import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';
import { retailersRoute } from '../routes/retailers.js';

@ApiTags('retailers')
@Controller(retailersRoute.controllerPath)
export class RetailersController {
  @Get()
  @ApiOkResponse({ description: retailersRoute.description })
  list() {
    return groceryApi.getRetailers();
  }
}
