import { BadRequestException, Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

type ItemHistoryPoint = {
  date: string;
  price: number;
  verified: boolean;
};

const historyDatePattern = /^\d{4}-\d{2}-\d{2}$/;

@ApiTags('items')
@Controller('items/:itemId')
export class ItemsRoutesController {
  @Get('observations')
  @ApiOkResponse({ description: 'Price observations' })
  @ApiQuery({
    name: 'atDate',
    required: false,
    description: 'Optional date (YYYY-MM-DD) to return latest historical price at or before this date',
    type: String
  })
  observations(@Param('itemId') itemId: string, @Query('atDate') atDate?: string) {
    const product = groceryApi.getProduct(itemId);
    if (!product) throw new NotFoundException('Product not found');

    if (atDate === undefined) {
      return product.history.map((point) => mapObservation(itemId, point));
    }

    if (!historyDatePattern.test(atDate)) {
      throw new BadRequestException('atDate must use YYYY-MM-DD format');
    }

    let selectedPoint: ItemHistoryPoint | null = null;
    for (const point of product.history) {
      if (point.date <= atDate && (selectedPoint === null || point.date > selectedPoint.date)) {
        selectedPoint = point;
      }
    }

    return selectedPoint ? [mapObservation(itemId, selectedPoint)] : [];
  }
}

function mapObservation(itemId: string, point: ItemHistoryPoint) {
  return {
    itemId,
    observedAt: `${point.date}T09:00:00Z`,
    price: point.price,
    currency: 'SEK',
    priceType: 'shelf',
    confidence: point.verified ? 'high' : 'low',
    sourceType: 'demo_seed',
    provenance: `demo://history/${itemId}/${point.date}`
  };
}
