import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { groceryApi } from '../demo-data.js';

@ApiTags('receipts')
@Controller('users/demo/receipts')
export class ReceiptsController {
  @Get('review')
  @ApiOkResponse({ description: 'Demo receipt review report with budget impact and writeback guardrails' })
  review() {
    return { ...groceryApi.getReceiptReviewReport('demo'), demo: true };
  }
}
