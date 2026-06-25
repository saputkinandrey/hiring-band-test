import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createE2eApp } from './e2e-test-app';

describe('Identity (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, logs in, and returns profile for the current tenant', async () => {
    const email = `identity-${Date.now()}@example.com`;
    const password = 'StrongPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .set('X-Correlation-Id', 'identity-flow-1')
      .send({
        brandId: 'brandA',
        email,
        password,
      })
      .expect(201)
      .expect((response) => {
        expect(response.body).toMatchObject({
          brandId: 'brandA',
          email,
        });
      });

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Correlation-Id', 'identity-flow-2')
      .send({
        brandId: 'brandA',
        email,
        password,
      })
      .expect(200);

    const cookie = loginResponse.headers['set-cookie'];
    expect(cookie).toBeDefined();
    expect(loginResponse.body).toMatchObject({
      brandId: 'brandA',
    });

    await request(app.getHttpServer())
      .get('/profile/me')
      .set('Cookie', cookie)
      .set('X-Correlation-Id', 'identity-flow-3')
      .expect(200)
      .expect((response) => {
        expect(response.body).toMatchObject({
          brandId: 'brandA',
          email,
        });
      });
  });

  it('returns structured 401 for invalid login', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .set('X-Correlation-Id', 'identity-invalid-login')
      .send({
        brandId: 'brandA',
        email: 'missing-user@example.com',
        password: 'wrong-password',
      })
      .expect(401);

    expect(response.body).toMatchObject({
      statusCode: 401,
      errorCode: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      path: '/auth/login',
      correlationId: 'identity-invalid-login',
    });
  });

  it('does not leak brandB profile to a brandA session', async () => {
    const suffix = Date.now().toString();
    const brandAEmail = `branda-${suffix}@example.com`;
    const brandBEmail = `brandb-${suffix}@example.com`;
    const password = 'StrongPassword123!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        brandId: 'brandA',
        email: brandAEmail,
        password,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        brandId: 'brandB',
        email: brandBEmail,
        password,
      })
      .expect(201);

    const brandALogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        brandId: 'brandA',
        email: brandAEmail,
        password,
      })
      .expect(200);

    const brandBCookie = (
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          brandId: 'brandB',
          email: brandBEmail,
          password,
        })
        .expect(200)
    ).headers['set-cookie'];

    await request(app.getHttpServer())
      .get('/profile/me')
      .set('Cookie', brandALogin.headers['set-cookie'])
      .expect(200)
      .expect((response) => {
        expect(response.body.email).toBe(brandAEmail);
        expect(response.body.brandId).toBe('brandA');
      });

    await request(app.getHttpServer())
      .get('/profile/me')
      .set('Cookie', brandBCookie)
      .expect(200)
      .expect((response) => {
        expect(response.body.email).toBe(brandBEmail);
        expect(response.body.brandId).toBe('brandB');
      });
  });
});
