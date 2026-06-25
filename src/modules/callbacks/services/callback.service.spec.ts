import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TenantRepository } from '../../../common/db/repositories/tenant.repository';
import { AppHttpException } from '../../../common/errors/app-http.exception';
import {
  CALLBACK_RESPONSE_STATUS_ACCEPTED,
  CALLBACK_RESPONSE_STATUS_DUPLICATE,
  CALLBACK_SOURCE_PSP,
  RAW_EVENT_STATUS_PENDING,
} from '../callbacks.constants';
import { RawEventRepository } from '../repositories/raw-event.repository';
import { CallbackService } from './callback.service';

describe('CallbackService', () => {
  let callbackService: CallbackService;
  let tenantRepository: {
    findActiveByBrandId: jest.Mock;
  };
  let rawEventRepository: {
    findByBrandSourceProviderIdempotencyKey: jest.Mock;
    create: jest.Mock;
  };

  const callbackPayload = {
    brandId: 'brandA',
    idempotencyKey: 'psp-payment-evt-001',
    payload: {
      amount: 1000,
      currency: 'USD',
    },
  };

  beforeEach(async () => {
    tenantRepository = {
      findActiveByBrandId: jest.fn(),
    };
    rawEventRepository = {
      findByBrandSourceProviderIdempotencyKey: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CallbackService,
        {
          provide: TenantRepository,
          useValue: tenantRepository,
        },
        {
          provide: RawEventRepository,
          useValue: rawEventRepository,
        },
      ],
    }).compile();

    callbackService = module.get(CallbackService);
  });

  it('persists a raw event for the first callback', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    rawEventRepository.findByBrandSourceProviderIdempotencyKey.mockResolvedValue(
      null,
    );
    rawEventRepository.create.mockResolvedValue({
      id: 'raw-event-1',
      brandId: 'brandA',
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      idempotencyKey: 'psp-payment-evt-001',
      payload: callbackPayload.payload,
      status: RAW_EVENT_STATUS_PENDING,
      createdAt: new Date('2026-06-25T10:00:00.000Z'),
    });

    const result = await callbackService.handleCallback({
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      dto: callbackPayload,
      correlationId: 'corr-1',
    });

    expect(result).toEqual({
      status: CALLBACK_RESPONSE_STATUS_ACCEPTED,
      rawEventId: 'raw-event-1',
      brandId: 'brandA',
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      idempotencyKey: 'psp-payment-evt-001',
    });
    expect(rawEventRepository.create).toHaveBeenCalledWith({
      brandId: 'brandA',
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      idempotencyKey: 'psp-payment-evt-001',
      payload: callbackPayload.payload,
      status: RAW_EVENT_STATUS_PENDING,
    });
  });

  it('returns duplicate status when idempotency key already exists', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    rawEventRepository.findByBrandSourceProviderIdempotencyKey.mockResolvedValue(
      {
        id: 'raw-event-1',
        brandId: 'brandA',
        source: CALLBACK_SOURCE_PSP,
        provider: 'stripe',
        idempotencyKey: 'psp-payment-evt-001',
        payload: callbackPayload.payload,
        status: RAW_EVENT_STATUS_PENDING,
        createdAt: new Date('2026-06-25T10:00:00.000Z'),
      },
    );

    const result = await callbackService.handleCallback({
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      dto: callbackPayload,
      correlationId: 'corr-2',
    });

    expect(result).toEqual({
      status: CALLBACK_RESPONSE_STATUS_DUPLICATE,
      brandId: 'brandA',
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      idempotencyKey: 'psp-payment-evt-001',
    });
    expect(rawEventRepository.create).not.toHaveBeenCalled();
  });

  it('returns duplicate status when idempotency unique constraint races', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue({
      brandId: 'brandA',
      name: 'Brand A',
      deletedAt: null,
    });
    rawEventRepository.findByBrandSourceProviderIdempotencyKey.mockResolvedValue(
      null,
    );
    rawEventRepository.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.19.3',
        meta: {
          target: ['brandId', 'source', 'provider', 'idempotencyKey'],
        },
      }),
    );

    const result = await callbackService.handleCallback({
      source: CALLBACK_SOURCE_PSP,
      provider: 'stripe',
      dto: callbackPayload,
      correlationId: 'corr-3',
    });

    expect(result.status).toBe(CALLBACK_RESPONSE_STATUS_DUPLICATE);
  });

  it('rejects callbacks for missing or inactive tenants', async () => {
    tenantRepository.findActiveByBrandId.mockResolvedValue(null);

    await expect(
      callbackService.handleCallback({
        source: CALLBACK_SOURCE_PSP,
        provider: 'stripe',
        dto: callbackPayload,
        correlationId: 'corr-4',
      }),
    ).rejects.toEqual(
      new AppHttpException(
        HttpStatus.BAD_REQUEST,
        'TENANT_NOT_FOUND',
        'Tenant is missing or inactive',
      ),
    );
  });
});
