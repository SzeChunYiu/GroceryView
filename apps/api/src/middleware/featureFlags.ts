import type { NextFunction, Request, Response } from 'express';
import { NotFoundException, type Middleware } from '@nestjs/common';
import type { QueryExecutor } from '../database/postgres-query-executor.service.js';
import { resolveFeatureIdentifier, evaluateFeatureFlagRequest, FEATURE_FLAG_QUERY_KEY } from '../lib/featureFlags.js';

export function featureFlagsMiddleware(postgres: QueryExecutor | null): Middleware {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!postgres) {
      return next();
    }

    const featureKey = resolveFeatureIdentifier(new URL(req.url, 'http://localhost').searchParams, req.headers);
    if (!featureKey) {
      return next();
    }

    const decision = await evaluateFeatureFlagRequest(postgres, featureKey, {
      userId: req.get('x-user-id'),
      authorization: req.headers.authorization,
      requestId: req.get('x-request-id'),
      forwardedFor: req.headers['x-forwarded-for'] as string,
      ip: req.ip
    });

    if (!decision.allowed) {
      throw new NotFoundException(
        `Feature '${featureKey}' is not yet available for your rollout cohort. Set ${FEATURE_FLAG_QUERY_KEY} to a different value or contact support.`
      );
    }

    return next();
  };
}
