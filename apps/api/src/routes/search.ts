import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { SearchableProduct } from '@groceryview/api';
import { allProducts } from '../demo-data.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface SearchResponse {
  query: string;
  items: SearchableProduct[];
  cursor: string | null;
  nextCursor: string | null;
  pageSize: number;
  hasMore: boolean;
}

function normalizeCursor(cursor?: string | null): number {
  const parsed = Number.parseInt(cursor ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function clampPageSize(value: string | number | undefined): number {
  if (value === undefined) return DEFAULT_PAGE_SIZE;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(Math.floor(parsed), MAX_PAGE_SIZE);
}

@ApiTags('search')
@Controller('search')
export class SearchController {
  @Get()
  @ApiOkResponse({ description: 'Search products with cursor-based pagination' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'cursor', required: false })
  @ApiQuery({ name: 'limit', required: false })
  list(
    @Query('q') query = '',
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string
  ): SearchResponse {
    const pageSize = clampPageSize(limit);
    const start = normalizeCursor(cursor);
    const products = allProducts(query) as SearchableProduct[];
    const nextIndex = start + pageSize;
    const hasMore = nextIndex < products.length;

    return {
      query,
      items: products.slice(start, nextIndex),
      cursor: cursor ?? null,
      nextCursor: hasMore ? String(nextIndex) : null,
      pageSize,
      hasMore
    };
  }
}
