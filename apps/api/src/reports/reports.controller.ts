import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, IsDateString } from 'class-validator';
import {
  getQueuedPriceReports,
  queuePriceReport,
  type ReportPriceInput,
  type ReportStatus
} from '../routes/reports.js';

class PriceReportDto {
  @IsString()
  itemId!: string;

  @IsNumber()
  @Min(0)
  reportedPrice!: number;

  @IsOptional()
  @IsString()
  storeName?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  observedAt?: string;
}

type ReportItem = {
  id: string;
  status: ReportStatus;
  createdAt: string;
  payload: ReportPriceInput;
};

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  @Get()
  @ApiOkResponse({ description: 'Queued price reports' })
  list() {
    return getQueuedPriceReports() as ReadonlyArray<ReportItem>;
  }

  @Post('price')
  @ApiCreatedResponse({ description: 'Price report queued for admin review' })
  create(@Body() body: PriceReportDto) {
    const payload: ReportPriceInput = {
      itemId: body.itemId,
      reportedPrice: body.reportedPrice,
      storeName: body.storeName,
      observedAt: body.observedAt,
      notes: body.notes
    };

    return queuePriceReport(payload);
  }
}
