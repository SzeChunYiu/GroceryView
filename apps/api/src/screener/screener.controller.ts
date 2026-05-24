import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { apiRouteTraceSpans, traceApiRoute } from '../instrumentation.js';
import { screenerRoutes } from '../routes/screener.js';
import { ScreenerService } from './screener.service.js';

@ApiTags('screener')
@Controller(screenerRoutes.controllerPath)
export class ScreenerController {
  constructor(private readonly screener: ScreenerService) {}

  @Get()
  @ApiOkResponse({ description: screenerRoutes.description })
  async list(
    @Query(screenerRoutes.minDiscountParam) minDiscount?: string,
    @Query('category') category?: string,
    @Query('limit') limit?: string
  ) {
    const parsed = {
      minDiscountPercent: parseBoundedNumber(minDiscount, screenerRoutes.minDiscountParam, screenerRoutes.minDiscountRange[0], screenerRoutes.minDiscountRange[1], 0),
      category: normalizeOptionalText(category),
      limit: parseBoundedNumber(limit, 'limit', 1, screenerRoutes.maxLimit, screenerRoutes.defaultLimit)
    };

    return traceApiRoute(apiRouteTraceSpans.screener, { route: screenerRoutes.list, minDiscountPercent: parsed.minDiscountPercent, category: parsed.category, limit: parsed.limit }, () => this.screener.discountRows(parsed));
  }
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function parseBoundedNumber(value: string | undefined, name: string, min: number, max: number, fallback: number): number {
  if (value === undefined || value.trim().length === 0) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new BadRequestException(`${name} query parameter must be a finite number.`);
  if (parsed < min || parsed > max) throw new BadRequestException(`${name} query parameter must be between ${min} and ${max}.`);
  return Math.round(parsed);
}
