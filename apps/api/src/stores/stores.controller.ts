import { Controller, Get, Param } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

export class StoreSummaryDto {
  slug!: string;
  name!: string;
  chain!: string;
  city!: string;
  district!: string;
  demo!: true;
}

const STORES: StoreSummaryDto[] = [
  {
    slug: 'ica-nara-odenplan',
    name: 'ICA Nära Odenplan',
    chain: 'ICA',
    city: 'Stockholm',
    district: 'Odenplan',
    demo: true,
  },
  {
    slug: 'willys-hemma-sodermalm',
    name: 'Willys Hemma Södermalm',
    chain: 'Willys',
    city: 'Stockholm',
    district: 'Södermalm',
    demo: true,
  },
];

@Controller('stores')
@ApiTags('stores')
export class StoresController {
  @Get()
  @ApiOperation({ summary: 'List demo store summaries' })
  @ApiOkResponse({ type: StoreSummaryDto, isArray: true })
  listStores(): StoreSummaryDto[] {
    return STORES;
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a demo store summary by slug' })
  @ApiParam({ name: 'slug', example: 'ica-nara-odenplan' })
  @ApiOkResponse({ type: StoreSummaryDto })
  getStore(@Param('slug') slug: string): StoreSummaryDto {
    return (
      STORES.find((store) => store.slug === slug) ?? {
        slug,
        name: 'Demo store placeholder',
        chain: 'Demo chain',
        city: 'Stockholm',
        district: 'Demo district',
        demo: true,
      }
    );
  }
}
