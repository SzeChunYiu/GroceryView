import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

export type WeeklyDeal = {
  id: string;
  productId: string;
  slug: string;
  productName: string;
  category: string;
  store: string;
  currentPrice: number;
  regularPrice: number;
  discountPercent: number;
  discountAmount: number;
  expiresAt: string;
};

function currentWeekRange() {
  const now = new Date();
  const day = now.getUTCDay();
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - ((day + 6) % 7)));
  const weekEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + (7 - ((day + 6) % 7) - 1), 23, 59, 59, 999));
  return { startsAt: weekStart.toISOString(), endsAt: weekEnd.toISOString() };
}

const weeklyDeals: WeeklyDeal[] = [
  {
    id: 'deal-weekly-zoegas-coffee-450g',
    productId: 'zoegas-coffee-450g',
    slug: 'zoegas-coffee-450g',
    productName: 'Zoégas Coffee 450g',
    category: 'coffee',
    store: 'Willys Odenplan',
    currentPrice: 49.9,
    regularPrice: 64.9,
    discountPercent: 23.11,
    discountAmount: 15.0,
    expiresAt: '2026-05-25T23:59:00.000Z'
  },
  {
    id: 'deal-weekly-eldorado-basmati-rice-1kg',
    productId: 'eldorado-basmati-rice-1kg',
    slug: 'eldorado-basmati-rice-1kg',
    productName: 'Eldorado Basmati Rice 1kg',
    category: 'rice',
    store: 'Matmissionen Hägersten',
    currentPrice: 18.9,
    regularPrice: 27.9,
    discountPercent: 32.26,
    discountAmount: 9.0,
    expiresAt: '2026-05-25T23:59:00.000Z'
  },
  {
    id: 'deal-weekly-felix-ketchup-1kg',
    productId: 'felix-ketchup-1kg',
    slug: 'felix-ketchup-1kg',
    productName: 'Felix Tomatketchup 1kg',
    category: 'pantry',
    store: 'Hemköp Stockholm',
    currentPrice: 32,
    regularPrice: 39.9,
    discountPercent: 19.8,
    discountAmount: 7.9,
    expiresAt: '2026-05-25T23:59:00.000Z'
  },
  {
    id: 'deal-weekly-garant-havregryn-1kg',
    productId: 'garant-havregryn-1kg',
    slug: 'garant-havregryn-1kg',
    productName: 'Garant Havregryn 1kg',
    category: 'breakfast',
    store: 'Tempo Hornstull',
    currentPrice: 21.9,
    regularPrice: 25.8,
    discountPercent: 15.12,
    discountAmount: 3.9,
    expiresAt: '2026-05-25T23:59:00.000Z'
  }
];

export function getWeeklyDeals() {
  return [...weeklyDeals].sort((left, right) => right.discountPercent - left.discountPercent);
}

@ApiTags('deals')
@Controller('deals')
export class WeeklyDealsController {
  @Get('weekly')
  @ApiOkResponse({ description: 'Current week sale deals from demo fixtures' })
  weekly() {
    const currentWeek = currentWeekRange();
    return {
      weekStartsAt: currentWeek.startsAt,
      weekEndsAt: currentWeek.endsAt,
      currency: 'SEK',
      demo: true,
      deals: getWeeklyDeals()
    };
  }
}
