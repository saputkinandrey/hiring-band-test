import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './e2e-test-app';

describe('Callbacks contract (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('accepts a valid GSP callback payload', async () => {
    const suffix = Date.now().toString();

    await request(app.getHttpServer())
      .post('/webhooks/gsp/checkout')
      .set('X-Correlation-Id', 'callback-contract-valid')
      .send({
        brandId: 'brandB',
        idempotencyKey: `gsp-idem-${suffix}`,
        payload: {
          gameRoundId: 'round-42',
          result: 'win',
        },
      })
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          status: 'accepted',
          brandId: 'brandB',
          source: 'gsp',
          provider: 'checkout',
        });
      });
  });

  it('rejects payload without brandId', async () => {
    const response = await request(app.getHttpServer())
      .post('/webhooks/psp/stripe')
      .set('X-Correlation-Id', 'callback-contract-missing-brand')
      .send({
        idempotencyKey: 'missing-brand-idem',
        payload: {
          amount: 100,
        },
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      path: '/webhooks/psp/stripe',
      correlationId: 'callback-contract-missing-brand',
    });
    expect(response.body.message).toContain('brandId');
  });

  it('rejects payload without idempotencyKey', async () => {
    const response = await request(app.getHttpServer())
      .post('/webhooks/psp/stripe')
      .set('X-Correlation-Id', 'callback-contract-missing-idem')
      .send({
        brandId: 'brandA',
        payload: {
          amount: 100,
        },
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      path: '/webhooks/psp/stripe',
      correlationId: 'callback-contract-missing-idem',
    });
    expect(response.body.message).toContain('idempotencyKey');
  });
});
