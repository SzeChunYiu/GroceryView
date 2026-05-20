import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import { demoStores, toStoreSummary } from '../demo-data';

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  @Get()
  @ApiOkResponse({ description: 'Demo store list.' })
  listStores() {
    return demoStores.map(toStoreSummary);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'willys-odenplan' })
  @ApiOkResponse({ description: 'Demo store detail.' })
  getStore(@Param('slug') slug: string) {
    const store = demoStores.find((item) => item.slug === slug);
    if (!store) {
      throw new NotFoundException(`Unknown store slug: ${slug}`);
    }
    return store;
  }
}
