import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

type HomePromotionBanner = {
  id: string;
  title: string;
  detail: string;
  ctaLabel: string;
  ctaHref: string;
  accent: 'cool' | 'mint' | 'warm';
};

@ApiTags('admin')
@Controller('admin')
export class AdminRoutesController {
  @Get('home-promotions')
  @ApiOkResponse({ description: 'Homepage promotional banner configuration' })
  listHomePromotions(): HomePromotionBanner[] {
    return [
      {
        id: 'seasonal-apr',
        title: 'Seasonal deals are live',
        detail: 'Fresh seasonal bundles in Stockholm are now rotated daily with top value highlights across stores.',
        ctaLabel: 'View seasonal deals',
        ctaHref: '/categories/produce',
        accent: 'warm'
      },
      {
        id: 'new-retailer',
        title: 'New retailer added',
        detail: 'A new Stockholm retailer is now live with verified shelf and confidence scoring enabled.',
        ctaLabel: 'See the new retailer',
        ctaHref: '/stores',
        accent: 'cool'
      },
      {
        id: 'weekly-basket',
        title: 'Weekly basket savings rotate',
        detail: 'Deal suggestions rotate through new high-confidence weekly savings opportunities each few seconds.',
        ctaLabel: 'Open basket planner',
        ctaHref: '/weekly-basket',
        accent: 'mint'
      }
    ];
  }
}
