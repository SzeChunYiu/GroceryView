import {
  Controller,
  NotFoundException,
  Query,
  Sse,
  type MessageEvent
} from '@nestjs/common';
import { Observable, interval, map } from 'rxjs';
import { allProducts } from '../demo-data.js';

export type PriceStreamEvent = {
  productId: string;
  storeId: string;
  storeName: string;
  price: number;
  currency: 'SEK';
  priceType: 'shelf';
  confidence: 'high' | 'medium';
  observedAt: string;
  sourceType: 'fallback-sse';
  provenance: string;
};

type SeededProduct = ReturnType<typeof allProducts>[number];

function pickRandom<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function jitterPrice(price: number): number {
  const delta = 1 + (Math.random() - 0.5) * 0.06;
  const next = price * delta;
  return Number(next.toFixed(2));
}

@Controller('prices')
export class PriceStreamController {
  @Sse('stream')
  stream(@Query('productId') productId?: string): Observable<MessageEvent> {
    const products = allProducts();
    const seedProducts = productId
      ? products.filter((product) => product.id === productId)
      : products;

    if (seedProducts.length === 0) {
      throw new NotFoundException('Product id not found');
    }

    return interval(2500).pipe(
      map(() => {
        const selected: SeededProduct = pickRandom(seedProducts);
        const selectedPrice = selected.currentPrices[0];
        const candidatePrice = jitterPrice(selectedPrice.price);
        const event: PriceStreamEvent = {
          productId: selected.id,
          storeId: selectedPrice.storeId,
          storeName: selectedPrice.storeName,
          price: candidatePrice,
          currency: 'SEK',
          priceType: 'shelf',
          confidence: selected.currentPrices[0].price === candidatePrice ? 'high' : 'medium',
          observedAt: new Date().toISOString(),
          sourceType: 'fallback-sse',
          provenance: `demo://prices/stream/${selected.id}`
        };
        return { type: 'price-update', data: event };
      })
    );
  }
}
