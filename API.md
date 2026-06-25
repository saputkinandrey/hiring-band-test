# API Reference

Concrete request/response examples are added incrementally as endpoints are implemented.

## Interactive Documentation

The primary API documentation source is Swagger UI:

- **Swagger UI:** http://localhost:3000/api
- **OpenAPI JSON:** http://localhost:3000/api-json

Start the application first (see [README.md](README.md)).

## Common Headers

| Header | Description |
|--------|-------------|
| `X-Correlation-Id` | Optional request correlation id. If omitted, the server generates one and returns it in the response. |

## Error Response Shape

Identity endpoints return structured errors:

```json
{
  "statusCode": 401,
  "errorCode": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "path": "/auth/login",
  "correlationId": "identity-invalid-login"
}
```

## Implemented Endpoints

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Service health check |

#### Example

```bash
curl http://localhost:3000/health
```

Response:

```json
{
  "status": "ok"
}
```

### Identity

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a user within a tenant |
| POST | `/auth/login` | Login and create an HttpOnly session cookie |
| GET | `/profile/me` | Return the current user profile from the session cookie |

#### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: register-1" \
  -d '{
    "brandId": "brandA",
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }'
```

Response `201`:

```json
{
  "id": "clx...",
  "brandId": "brandA",
  "email": "user@example.com",
  "createdAt": "2026-06-25T16:00:00.000Z"
}
```

Duplicate email within the same tenant returns `409` with `errorCode: "DUPLICATE_EMAIL"`.

#### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: login-1" \
  -c cookies.txt \
  -d '{
    "brandId": "brandA",
    "email": "user@example.com",
    "password": "StrongPassword123!"
  }'
```

Response `200`:

```json
{
  "brandId": "brandA",
  "userId": "clx...",
  "expiresAt": "2026-07-02T16:00:00.000Z"
}
```

The server also sets an HttpOnly `session` cookie. Invalid credentials return `401` with `errorCode: "INVALID_CREDENTIALS"`.

#### Profile

```bash
curl http://localhost:3000/profile/me \
  -H "X-Correlation-Id: profile-1" \
  -b cookies.txt
```

Response `200`:

```json
{
  "id": "clx...",
  "brandId": "brandA",
  "email": "user@example.com",
  "createdAt": "2026-06-25T16:00:00.000Z"
}
```

Missing or invalid session cookie returns `401` with `errorCode: "UNAUTHORIZED"`.

### Callbacks

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/psp/:provider` | Receive a PSP provider callback |
| POST | `/webhooks/gsp/:provider` | Receive a GSP provider callback |

Callback requests do **not** use `Idempotency-Key` or tenant headers. Tenant and idempotency data come from the JSON body:

| Field | Description |
|-------|-------------|
| `brandId` | Tenant key; must match an active seeded tenant (`brandA`, `brandB`) |
| `idempotencyKey` | Deduplication key supplied by the provider integration |
| `payload` | Original provider message as a JSON object |

#### PSP callback (accepted)

```bash
curl -X POST http://localhost:3000/webhooks/psp/stripe \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: psp-callback-1" \
  -d '{
    "brandId": "brandA",
    "idempotencyKey": "psp-payment-evt-001",
    "payload": {
      "amount": 1000,
      "currency": "USD",
      "status": "completed"
    }
  }'
```

Response `200`:

```json
{
  "status": "accepted",
  "rawEventId": "clx...",
  "brandId": "brandA",
  "source": "psp",
  "provider": "stripe",
  "idempotencyKey": "psp-payment-evt-001"
}
```

#### PSP callback (duplicate)

Sending the same `brandId`, provider path, and `idempotencyKey` again returns `200` (not `409`):

```json
{
  "status": "duplicate",
  "brandId": "brandA",
  "source": "psp",
  "provider": "stripe",
  "idempotencyKey": "psp-payment-evt-001"
}
```

No second `raw_events` row is created for the duplicate.

#### GSP callback

```bash
curl -X POST http://localhost:3000/webhooks/gsp/checkout \
  -H "Content-Type: application/json" \
  -H "X-Correlation-Id: gsp-callback-1" \
  -d '{
    "brandId": "brandB",
    "idempotencyKey": "gsp-round-evt-001",
    "payload": {
      "gameRoundId": "round-42",
      "result": "win"
    }
  }'
```

#### Callback validation error

Missing required body fields return `400` with `errorCode: "VALIDATION_ERROR"`:

```json
{
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "brandId should not be empty",
  "path": "/webhooks/psp/stripe",
  "correlationId": "callback-contract-missing-brand"
}
```

Unknown or inactive `brandId` returns `400` with `errorCode: "TENANT_NOT_FOUND"`.
