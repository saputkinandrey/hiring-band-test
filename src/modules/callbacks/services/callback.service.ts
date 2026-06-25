import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantRepository } from '../../../common/db/repositories/tenant.repository';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import {
  CALLBACK_RESPONSE_STATUS_ACCEPTED,
  CALLBACK_RESPONSE_STATUS_DUPLICATE,
  RAW_EVENT_STATUS_PENDING,
  type CallbackSource,
} from '../callbacks.constants';
import { RawEventRepository } from '../repositories/raw-event.repository';
import type { CallbackResponse } from '../types/callback-response.type';
import type { HandleCallbackInput } from '../types/handle-callback-input.type';

@Injectable()
export class CallbackService {
  private readonly logger = new Logger(CallbackService.name);

  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly rawEventRepository: RawEventRepository,
  ) {}

  async handleCallback(input: HandleCallbackInput): Promise<CallbackResponse> {
    const { brandId, idempotencyKey, payload } = input.dto;

    await this.ensureActiveTenant(brandId, input.correlationId);

    const existingRawEvent =
      await this.rawEventRepository.findByBrandSourceProviderIdempotencyKey({
        brandId,
        source: input.source,
        provider: input.provider,
        idempotencyKey,
      });

    if (existingRawEvent) {
      this.logDuplicateCallback(input, brandId, idempotencyKey);
      return this.buildDuplicateResponse(
        brandId,
        input.source,
        input.provider,
        idempotencyKey,
      );
    }

    try {
      const rawEvent = await this.rawEventRepository.create({
        brandId,
        source: input.source,
        provider: input.provider,
        idempotencyKey,
        payload: payload as Prisma.InputJsonValue,
        status: RAW_EVENT_STATUS_PENDING,
      });

      this.logger.log(
        `[${input.correlationId}] Accepted ${input.source} callback for tenant ${brandId}, provider ${input.provider}, idempotencyKey ${idempotencyKey}`,
      );

      return {
        status: CALLBACK_RESPONSE_STATUS_ACCEPTED,
        rawEventId: rawEvent.id,
        brandId,
        source: input.source,
        provider: input.provider,
        idempotencyKey,
      };
    } catch (error: unknown) {
      if (this.isIdempotencyUniqueViolation(error)) {
        this.logDuplicateCallback(input, brandId, idempotencyKey);
        return this.buildDuplicateResponse(
          brandId,
          input.source,
          input.provider,
          idempotencyKey,
        );
      }

      throw error;
    }
  }

  private async ensureActiveTenant(
    brandId: string,
    correlationId: string,
  ): Promise<void> {
    const tenant = await this.tenantRepository.findActiveByBrandId(brandId);

    if (!tenant) {
      this.logger.warn(
        `[${correlationId}] Tenant ${brandId} is missing or inactive`,
      );
      throw new AppHttpException(
        HttpStatus.BAD_REQUEST,
        'TENANT_NOT_FOUND',
        'Tenant is missing or inactive',
      );
    }
  }

  private buildDuplicateResponse(
    brandId: string,
    source: CallbackSource,
    provider: string,
    idempotencyKey: string,
  ): CallbackResponse {
    return {
      status: CALLBACK_RESPONSE_STATUS_DUPLICATE,
      brandId,
      source,
      provider,
      idempotencyKey,
    };
  }

  private logDuplicateCallback(
    input: HandleCallbackInput,
    brandId: string,
    idempotencyKey: string,
  ): void {
    this.logger.log(
      `[${input.correlationId}] Duplicate ${input.source} callback for tenant ${brandId}, provider ${input.provider}, idempotencyKey ${idempotencyKey}`,
    );
  }

  private isIdempotencyUniqueViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002' &&
      Array.isArray(error.meta?.target) &&
      error.meta.target.includes('idempotencyKey')
    );
  }
}
