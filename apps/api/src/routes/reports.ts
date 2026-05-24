import { BadRequestException, Body, Controller, HttpCode, HttpStatus, NotFoundException, Param, Post, ServiceUnavailableException } from '@nestjs/common';
import { ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, Length } from 'class-validator';
import { reportItemEndpoint, type ItemReportIssue, type ReportItemResult } from '@groceryview/api';
import { PostgresQueryExecutorService } from '../database/postgres-query-executor.service.js';

type ProductIdentifierRow = {
  product_id: string;
  canonical_name: string;
};

class ReportItemDto {
  @IsIn(['wrong_category', 'wrong_image', 'incorrect_name'])
  issue!: ItemReportIssue;

  @IsOptional()
  @IsString()
  @Length(0, 140)
  details?: string;
}

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly database: PostgresQueryExecutorService) {}

  @Post(reportItemEndpoint.actionPath)
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ description: 'Item information report queued for admin review' })
  async reportItem(@Param('itemId') itemId: string, @Body() body: ReportItemDto): Promise<ReportItemResult> {
    const trimmedId = itemId.trim();
    if (!trimmedId) throw new NotFoundException('Item not found.');
    if (!body.issue) throw new BadRequestException('issue is required.');

    if (!this.database.isConfigured()) {
      throw new ServiceUnavailableException('DATABASE_URL is required to capture item reports for review.');
    }

    const targetProducts = await this.database.query<ProductIdentifierRow>(
      `select p.id::text as product_id, p.canonical_name as canonical_name
       from products p
       where p.id = $1 or p.barcode = $1 or p.slug = $1
       limit 1`,
      [trimmedId]
    );

    const targetProduct = targetProducts[0];
    if (!targetProduct) throw new NotFoundException('Item not found.');

    const normalizedIssue = body.issue;
    const details = typeof body.details === 'string' ? body.details.trim() : '';
    const timestamp = new Date().toISOString();
    const issuePayload = [
      `${normalizedIssue.replaceAll('_', ' ')} issue reported for ${targetProduct.canonical_name}.`,
      ...(details ? [details] : [])
    ]
      .join(' ')
      .trim()
      .slice(0, 255);
    const assignmentId = `item-report-${crypto.randomUUID()}`;
    const reviewId = `report-${assignmentId}`;
    const priority = normalizedIssue === 'incorrect_name' ? 'high' : 'medium';
    const dueAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    await this.database.query(
      `insert into human_review_assignments(
         id, review_id, subject_type, subject_id, priority, reason, assignee_id, assigned_at, due_at, status
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (id) do update set
         review_id = excluded.review_id,
         subject_type = excluded.subject_type,
         subject_id = excluded.subject_id,
         priority = excluded.priority,
         reason = excluded.reason,
         assignee_id = excluded.assignee_id,
         assigned_at = excluded.assigned_at,
         due_at = excluded.due_at,
         status = excluded.status,
         updated_at = now()`
      ,
      [
        assignmentId,
        reviewId,
        'product_match',
        targetProduct.product_id,
        priority,
        issuePayload,
        'unassigned',
        timestamp,
        dueAt,
        'assigned'
      ]
    );

    return {
      reportId: assignmentId,
      status: 'accepted',
      reviewQueue: {
        reviewId,
        assigneeId: 'unassigned',
        priority,
        dueAt,
        reason: issuePayload
      }
    };
  }
}
