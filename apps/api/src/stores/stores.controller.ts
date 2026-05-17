import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiParam, ApiTags } from '@nestjs/swagger';
import type { StoreSummary } from '@groceryview/api-contracts';

export class StoreSummaryResponse implements StoreSummary {
  id!: string;
  slug!: string;
  name!: string;
  chain!: string;
  city!: string;
  district!: string;
  latitude!: number;
  longitude!: number;
  priceLevelIndex!: number;
  lastObservedAt!: string;
  demo!: true;
}

export class StoreDetailResponse extends StoreSummaryResponse {
  openingHoursSummary!: string;
  featuredDealProductSlugs!: string[];
}

const DEMO_STORES: StoreSummaryResponse[] = [
  {
    id: 'demo-store-willys-odenplan',
    slug: 'willys-odenplan',
    name: 'Willys Odenplan',
    chain: 'Willys',
    city: 'Stockholm',
    district: 'Odenplan',
    latitude: 59.3428,
    longitude: 18.0495,
    priceLevelIndex: 92,
    lastObservedAt: '2026-05-16T09:30:00.000Z',
    demo: true,
  },
  {
    id: 'demo-store-ica-kvantum-liljeholmen',
    slug: 'ica-kvantum-liljeholmen',
    name: 'ICA Kvantum Liljeholmen',
    chain: 'ICA',
    city: 'Stockholm',
    district: 'Liljeholmen',
    latitude: 59.3107,
    longitude: 18.0225,
    priceLevelIndex: 101,
    lastObservedAt: '2026-05-16T08:45:00.000Z',
    demo: true,
  },
];

const DEFAULT_STORE = DEMO_STORES[0]!;

@ApiTags('stores')
@Controller('stores')
export class StoresController {
  @Get()
  @ApiOkResponse({ type: StoreSummaryResponse, isArray: true })
  findAll(): StoreSummaryResponse[] {
    return DEMO_STORES;
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', example: 'willys-odenplan' })
  @ApiOkResponse({ type: StoreDetailResponse })
  findOne(@Param('slug') slug: string): StoreDetailResponse {
    const store =
      DEMO_STORES.find((candidate) => candidate.slug === slug) ?? DEFAULT_STORE;

    return {
      ...store,
      openingHoursSummary: 'Seed/demo opening hours: 08:00-22:00 daily',
      featuredDealProductSlugs: ['zoegas-skane-mellanrost-450g'],
    };
  }
}
