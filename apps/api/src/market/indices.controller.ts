import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('market')
@Controller('indices')
export class IndicesController {
  @Get()
  @ApiOkResponse({ description: 'List grocery indices' })
  list() {
    return groceryApi.getIndices().map((index) => ({ ...index, demo: true }));
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Grocery index detail' })
  detail(@Param('id') id: string) {
    const index = groceryApi.getIndex(id);
    if (!index) throw new NotFoundException('Index not found');
    return { ...index, demo: true };
  }
}
