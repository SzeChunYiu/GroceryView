import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Module } from '@nestjs/common';

type PromotionalBanner = {
  id: string;
  heading: string;
  subheading: string;
  copy: string;
  ctaLabel: string;
  ctaHref: string;
  theme: 'emerald' | 'indigo' | 'rose';
};

export const promotionalBanners: PromotionalBanner[] = [
  {
    id: 'weekend-savings',
    heading: 'Save on the biggest weekly buys',
    subheading: 'Updated each quarter',
    copy: 'Open-price and partner-flyer evidence now powers a rotating offer strip for high-impact basket essentials.',
    ctaLabel: 'Browse weekly savings',
    ctaHref: '/catalogue-savings',
    theme: 'emerald'
  },
  {
    id: 'new-locale-copy',
    heading: 'Verified prices in Swedish',
    subheading: 'Source-first everywhere',
    copy: 'New locale-safe copy and product confidence labels arrive in the homepage header to make route navigation clearer.',
    ctaLabel: 'Open source claims',
    ctaHref: '/data-sources',
    theme: 'indigo'
  },
  {
    id: 'scanner-ready',
    heading: 'Turn your receipts into smarter lists',
    subheading: 'Fast launch',
    copy: 'Try the receipt scanner and convert trusted rows to grocery watchlists in under a minute.',
    ctaLabel: 'Try scanner mode',
    ctaHref: '/scanner',
    theme: 'rose'
  }
];

@ApiTags('admin')
@Controller('admin')
export class AdminRoutesController {
  @Get('promotional-banners')
  @ApiOkResponse({ description: 'Homepage promotional banners for rotation', type: Object })
  listPromotionalBanners() {
    return { banners: promotionalBanners };
  }
}

@Module({ controllers: [AdminRoutesController] })
export class AdminRoutesModule {}
