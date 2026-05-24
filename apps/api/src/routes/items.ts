import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { allProducts, productPrices } from '../demo-data.js';

function parsePageNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function itemMatchesFilter(item: ReturnType<typeof allProducts>[number], key: string, value: string): boolean {
  const normalized = value.toLowerCase();
  if (key === 'category') return item.category.toLowerCase() === normalized;
  if (key === 'chain') return item.availableChains.some((chain) => chain.toLowerCase() === normalized);
  return true;
}

@ApiTags('items')
@Controller('items')
export class ItemsController {
  @Get()
  @ApiOkResponse({ description: 'Paginated item list with catalog filters' })
  list(
    @Query('q') query = '',
    @Query('category') category?: string,
    @Query('chain') chain?: string,
    @Query('limit') limitQuery?: string,
    @Query('offset') offsetQuery?: string
  ) {
    const filters = Object.entries({ category, chain }).filter((entry): entry is [string, string] => entry[1] !== undefined);
    const limit = Math.min(parsePageNumber(limitQuery, 20), 100);
    const offset = parsePageNumber(offsetQuery, 0);
    const filtered = allProducts(query).filter((item) => filters.every(([key, value]) => itemMatchesFilter(item, key, value)));

    return {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
      demo: true
    };
  }

  @Get(':id/prices')
  @ApiOkResponse({ description: 'Current item prices' })
  prices(@Param('id') id: string) {
    if (!allProducts().some((item) => item.id === id)) throw new NotFoundException('Item not found');
    return {
      itemId: id,
      prices: productPrices(id),
      demo: true
    };
  }

  @Get(':id')
  @ApiOkResponse({ description: 'Item detail data' })
  detail(@Param('id') id: string) {
    const item = allProducts().find((candidate) => candidate.id === id);
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
