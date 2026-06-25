import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/db/services/prisma.service';
import type { CallbackSource } from '../callbacks.constants';
import type { CreateRawEventInput } from '../types/raw-event-record.type';
import type { RawEventRecord } from '../types/raw-event-record.type';

type FindByIdempotencyInput = {
  brandId: string;
  source: CallbackSource;
  provider: string;
  idempotencyKey: string;
};

@Injectable()
export class RawEventRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByBrandSourceProviderIdempotencyKey(
    input: FindByIdempotencyInput,
  ): Promise<RawEventRecord | null> {
    return this.prisma.rawEvent.findUnique({
      where: {
        brandId_source_provider_idempotencyKey: {
          brandId: input.brandId,
          source: input.source,
          provider: input.provider,
          idempotencyKey: input.idempotencyKey,
        },
      },
      select: {
        id: true,
        brandId: true,
        source: true,
        provider: true,
        idempotencyKey: true,
        payload: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async create(input: CreateRawEventInput): Promise<RawEventRecord> {
    return this.prisma.rawEvent.create({
      data: {
        brandId: input.brandId,
        source: input.source,
        provider: input.provider,
        idempotencyKey: input.idempotencyKey,
        payload: input.payload,
        status: input.status,
      },
      select: {
        id: true,
        brandId: true,
        source: true,
        provider: true,
        idempotencyKey: true,
        payload: true,
        status: true,
        createdAt: true,
      },
    });
  }
}
