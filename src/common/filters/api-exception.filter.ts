import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErrorResponse } from '../types/api-error-response.type';
import type { RequestWithCorrelation } from '../types/request-with-correlation.type';
import { AppHttpException } from '../errors/app-http.exception';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<RequestWithCorrelation>();

    const statusCode = this.resolveStatusCode(exception);
    const errorCode = this.resolveErrorCode(exception, statusCode);
    const message = this.resolveMessage(exception, statusCode);
    const correlationId = request.correlationId ?? 'unknown';

    if (statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${correlationId}] ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    const body: ApiErrorResponse = {
      statusCode,
      errorCode,
      message,
      path: request.url,
      correlationId,
    };

    response.status(statusCode).json(body);
  }

  private resolveStatusCode(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private resolveErrorCode(exception: unknown, statusCode: number): string {
    if (exception instanceof AppHttpException) {
      return exception.errorCode;
    }

    if (exception instanceof HttpException) {
      if (statusCode === HttpStatus.BAD_REQUEST) {
        return 'VALIDATION_ERROR';
      }

      if (statusCode === HttpStatus.UNAUTHORIZED) {
        return 'UNAUTHORIZED';
      }

      if (statusCode === HttpStatus.CONFLICT) {
        return 'CONFLICT';
      }
    }

    return 'INTERNAL_ERROR';
  }

  private resolveMessage(exception: unknown, statusCode: number): string {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (typeof response === 'object' && response !== null) {
        const message = (response as { message?: string | string[] }).message;

        if (Array.isArray(message)) {
          return message.join('; ');
        }

        if (typeof message === 'string') {
          return message;
        }
      }
    }

    if (statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
      return 'Internal server error';
    }

    return 'Request failed';
  }
}
