import type { Prisma } from '@prisma/client';
import type { CallbackSource } from '../callbacks.constants';

export type RawEventRecord = {
  id: string;
  brandId: string;
  source: CallbackSource;
  provider: string;
  idempotencyKey: string;
  payload: Prisma.JsonValue;
  status: string;
  createdAt: Date;
};

export type CreateRawEventInput = {
  brandId: string;
  source: CallbackSource;
  provider: string;
  idempotencyKey: string;
  payload: Prisma.InputJsonValue;
  status: string;
};
