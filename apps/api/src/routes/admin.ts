import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthMiddleware, requiredAdminRole } from '../middleware/adminAuth.js';
import { captureProductPageScreenshot } from '../../../packages/scraper/src/screenshotter.js';

type MergePayload = {
  sourceProductId: string;
  targetProductId: string;
};

type OutlierSnapshot = {
  id: string;
  name: string;
  currentPrice: number;
  productUrl: string;
};

@ApiTags('admin')
@UseGuards(AdminAuthMiddleware)
@Controller('admin')
export class AdminController {
  @Get('health')
  @ApiOperation({ summary: 'Admin health check for privileged tools' })
  @ApiOkResponse({ description: 'Admin service is reachable' })
  @requiredAdminRole('admin')
  health() {
    return { status: 'ok', scope: 'admin' };
  }

  @Get('outliers')
  @ApiOperation({ summary: 'List price outliers that may need screenshot verification' })
  @requiredAdminRole('admin')
  outliers() {
    const candidates: OutlierSnapshot[] = [
      {
        id: 'willys-mocha-coffee',
        name: 'High-value coffee blend',
        currentPrice: 349.9,
        productUrl: 'https://example.com/product/willys-mocha-coffee'
      }
    ];

    return { candidates };
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product' })
  @ApiOkResponse({ description: 'Delete product record (super-admin only)' })
  @ApiForbiddenResponse({ description: 'Super-admin role required' })
  @requiredAdminRole('super-admin')
  deleteProduct() {
    return { deleted: true };
  }

  @Post('products/:id/merge')
  @ApiOperation({ summary: 'Merge product record' })
  @ApiOkResponse({ description: 'Merge product records (super-admin only)' })
  @ApiForbiddenResponse({ description: 'Super-admin role required' })
  @requiredAdminRole('super-admin')
  mergeProducts() {
    return { merged: true };
  }

  @Post('outliers/:id/screenshot')
  @ApiOperation({ summary: 'Capture admin review screenshot for a product page' })
  @ApiOkResponse({ description: 'Outlier screenshot capture scheduled' })
  @ApiForbiddenResponse({ description: 'Super-admin role is required for this endpoint' })
  @requiredAdminRole('super-admin')
  async captureOutlierScreenshot(@Body() body: { id: string; url: string }) {
    const snapshot = await captureProductPageScreenshot({
      productId: body.id,
      productUrl: body.url
    });

    return snapshot;
  }

  @Post('scraper/trigger')
  @ApiOperation({ summary: 'Trigger scraper run' })
  @ApiOkResponse({ description: 'Scraper trigger accepted (super-admin only)' })
  @ApiForbiddenResponse({ description: 'Super-admin role required' })
  @requiredAdminRole('super-admin')
  triggerScraper(@Body() body?: MergePayload) {
    void body;
    return { triggered: true };
  }
}
