import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  @Get()
  @ApiOkResponse({ description: 'List grocery stores.' })
  listStores() {
    return { items: [] };
  }

  @Get(':slug')
  @ApiOkResponse({ description: 'Fetch one grocery store by slug.' })
  getStore(@Param('slug') slug: string) {
    return { slug };
  }
}
