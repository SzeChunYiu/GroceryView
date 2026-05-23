import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Query } from '@nestjs/common';
import { groceryApi } from '../demo-data.js';
import { queryItems, type ItemSource, type ItemsQueryFilter } from '../../../packages/db/src/queries/items.js';
import { parseItemsQuery } from '../middleware/validate.js';
import type { ProductDetail } from '@groceryview/api';

type ItemResponse = {
  id: string;
  name: string;
  category: string;
  storeIds: string[];
  onSale: boolean;
  organic: boolean;
  bestPrice: number | null;
};

type ItemsResponse = {
  items: ItemResponse[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function isProductDetail(product: ProductDetail | null): product is ProductDetail {
  return product !== null;
}

function buildItemRows(): ItemSource[] {
  return groceryApi
    .searchProducts('')
    .map((product) => groceryApi.getProduct(product.id))
    .filter(isProductDetail)
    .map((product) => {
      const bestPrice = product.currentPrices.reduce((lowest, price) => (price.price < lowest ? price.price : lowest), Number.POSITIVE_INFINITY);
      return {
        id: product.id,
        name: product.name,
        category: product.category,
        storeIds: product.currentPrices.map((price) => price.storeId),
        onSale: product.dealScore >= 80,
        organic: product.brandTier === 'organic_private_label',
        bestPrice: Number.isFinite(bestPrice) ? bestPrice : undefined
      };
    });
}

@ApiTags('items')
@Controller('api/items')
export class ItemsController {
  @Get()
  @ApiOkResponse({ description: 'Paginated searchable item list.' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by one or more categories (comma-separated or repeated). Example: ?category=coffee&category=dairy' })
  @ApiQuery({ name: 'store', required: false, description: 'Filter to items sold by a specific store id.' })
  @ApiQuery({ name: 'onSale', required: false, description: 'When true, include only current on-sale items. When false, exclude them.' })
  @ApiQuery({ name: 'organic', required: false, description: 'When true, include only organic items.' })
  @ApiQuery({ name: 'q', required: false, description: 'Free-text search against product id, name, and category.' })
  @ApiQuery({ name: 'page', required: false, description: '1-based page number (default 1).' })
  @ApiQuery({ name: 'pageSize', required: false, description: `Page size (max ${50}). Default ${10}.` })
  list(@Query() query: Record<string, unknown>): ItemsResponse {
    const parsed = parseItemsQuery(query);
    const catalog = buildItemRows();
    const queryInput: ItemsQueryFilter = {
      category: parsed.category,
      ...(parsed.store ? { store: parsed.store } : {}),
      ...(parsed.onSale !== undefined ? { onSale: parsed.onSale } : {}),
      ...(parsed.organic !== undefined ? { organic: parsed.organic } : {}),
      ...(parsed.q ? { q: parsed.q } : {}),
      page: parsed.page,
      pageSize: parsed.pageSize
    };

    const { items, total, page, pageSize, totalPages } = queryItems({
      items: catalog,
      query: queryInput
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        storeIds: [...item.storeIds],
        onSale: item.onSale,
        organic: item.organic,
        bestPrice: item.bestPrice ?? null
      })),
      total,
      page,
      pageSize,
      totalPages
    };
  }
}
