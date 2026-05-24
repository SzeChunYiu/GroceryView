import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { buildStoreChainOverview, buildStoreList } from '../routes/stores.js';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  @Get()
  @ApiOkResponse({ description: 'Store list' })
  list() {
    return buildStoreList();
  }

  @Get('retailers')
  @ApiOkResponse({ description: 'Store chain overview' })
  chainOverview() {
    return buildStoreChainOverview();
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Store detail' })
  detail(@Param('id') id: string) {
    const stores = buildStoreList();
    const store = stores.find((candidate) => candidate.id === id);
    if (!store) throw new NotFoundException('Store not found');
    return store;
  }
}
