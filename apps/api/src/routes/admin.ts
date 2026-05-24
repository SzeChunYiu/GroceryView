import { Body, Controller, Delete, Get, Post, UseGuards } from '@nestjs/common';
import { ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AdminAuthMiddleware, requiredAdminRole } from '../middleware/adminAuth.js';

type MergePayload = {
  sourceProductId: string;
  targetProductId: string;
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

