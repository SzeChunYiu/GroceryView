import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

interface StoreSummary {
  id: string;
  slug: string;
  name: string;
  chain: string;
  city: 'Stockholm';
  district: string;
  latitude: number;
  longitude: number;
  latestObservationCount: number;
  dataStatus: 'seed_demo';
}

interface StoreDetail extends StoreSummary {
  address: string;
  openingHoursSummary: string;
  priceLevelIndex: number;
  lastObservedAt: string;
}

const primaryDemoStore: StoreDetail = {
  id: 'store_willys_odenplan',
  slug: 'willys-odenplan',
  name: 'Willys Odenplan',
  chain: 'Willys',
  city: 'Stockholm',
  district: 'Vasastan',
  latitude: 59.342,
  longitude: 18.049,
  latestObservationCount: 128,
  dataStatus: 'seed_demo',
  address: 'Karlbergsvägen 24, 113 27 Stockholm',
  openingHoursSummary: 'Mon-Sun 08:00-22:00',
  priceLevelIndex: 94,
  lastObservedAt: '2026-05-16T08:00:00.000Z',
};

const demoStores: StoreDetail[] = [
  primaryDemoStore,
  {
    id: 'store_ica_liljeholmen',
    slug: 'ica-kvantum-liljeholmen',
    name: 'ICA Kvantum Liljeholmen',
    chain: 'ICA',
    city: 'Stockholm',
    district: 'Liljeholmen',
    latitude: 59.3109,
    longitude: 18.0227,
    latestObservationCount: 112,
    dataStatus: 'seed_demo',
    address: 'Liljeholmstorget 3, 117 63 Stockholm',
    openingHoursSummary: 'Mon-Sun 07:00-23:00',
    priceLevelIndex: 101,
    lastObservedAt: '2026-05-16T07:30:00.000Z',
  },
];

function toSummary(store: StoreDetail): StoreSummary {
  return {
    id: store.id,
    slug: store.slug,
    name: store.name,
    chain: store.chain,
    city: store.city,
    district: store.district,
    latitude: store.latitude,
    longitude: store.longitude,
    latestObservationCount: store.latestObservationCount,
    dataStatus: store.dataStatus,
  };
}

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  @Get()
  @ApiOperation({ summary: 'List demo Stockholm stores' })
  listStores(): StoreSummary[] {
    return demoStores.map(toSummary);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a demo store by slug' })
  @ApiParam({ name: 'slug', example: 'willys-odenplan' })
  getStore(@Param('slug') slug: string): StoreDetail {
    return demoStores.find((store) => store.slug === slug) ?? primaryDemoStore;
  }
}
