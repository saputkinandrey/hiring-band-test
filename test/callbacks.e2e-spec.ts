import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/common/db/services/prisma.service';
import { createE2eApp } from './e2e-test-app';

describe('Callbacks (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createE2eApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates one raw event and returns duplicate for repeated PSP callback', async () => {
    const suffix = Date.now().toString();
    const payload = {
      brandId: 'brandA',
      idempotencyKey: `psp-idem-${suffix}`,
      payload: {
        amount: 1500,
        currency: 'USD',
        status: 'completed',
      },
    };

    const firstResponse = await request(app.getHttpServer())
      .post('/webhooks/psp/stripe')
      .set('X-Correlation-Id', 'callback-e2e-1')
      .send(payload)
      .expect(200);

    expect(firstResponse.body).toMatchObject({
      status: 'accepted',
      brandId: 'brandA',
      source: 'psp',
      provider: 'stripe',
      idempotencyKey: payload.idempotencyKey,
    });
    expect(firstResponse.body.rawEventId).toEqual(expect.any(String));

    const duplicateResponse = await request(app.getHttpServer())
      .post('/webhooks/psp/stripe')
      .set('X-Correlation-Id', 'callback-e2e-2')
      .send(payload)
      .expect(200);

    expect(duplicateResponse.body).toEqual({
      status: 'duplicate',
      brandId: 'brandA',
      source: 'psp',
      provider: 'stripe',
      idempotencyKey: payload.idempotencyKey,
    });

    const rawEventCount = await prisma.rawEvent.count({
      where: {
        brandId: 'brandA',
        source: 'psp',
        provider: 'stripe',
        idempotencyKey: payload.idempotencyKey,
      },
    });

    expect(rawEventCount).toBe(1);
  });
});
