import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../constants/http.constants';
import type { RequestWithCorrelation } from '../types/request-with-correlation.type';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(
    request: RequestWithCorrelation,
    response: Response,
    next: NextFunction,
  ): void {
    const headerValue = request.header(CORRELATION_ID_HEADER);
    const correlationId =
      headerValue && headerValue.trim().length > 0
        ? headerValue.trim()
        : randomUUID();

    request.correlationId = correlationId;
    response.setHeader(CORRELATION_ID_HEADER, correlationId);
    next();
  }
}
