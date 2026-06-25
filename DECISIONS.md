# Design Decisions

Architecture choices and trade-offs for the hiring band test backend. Updated incrementally as tasks are implemented.

## Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | NestJS + TypeScript | Required by assignment; strong module boundaries and DI |
| Database | PostgreSQL | Relational model fits users, sessions, raw_events; no NoSQL needed |
| ORM | Prisma | Type-safe schema, migrations, and Prisma Client |
| Local run | Docker Compose | Deterministic setup for reviewers; app + PostgreSQL in one command |

## Module Boundaries

```
common/
  db/           - Prisma service and data access (task 02)
modules/
  identity/   - Registration, login, profile (task 03)
  callbacks/  - PSP/GSP webhook adapters (task 04)
```

Controllers stay thin; business logic lives in services; persistence goes through Prisma.

## OpenAPI Generation

Swagger is configured via `@nestjs/swagger`:

- Swagger UI at `/api`
- OpenAPI JSON at `/api-json`

Endpoint DTOs and responses are documented with decorators as features are added.

## Identity Authentication

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth model | Opaque server-side sessions | Session validity is controlled through the `sessions` table (`expiresAt`, `revokedAt`) |
| Session transport | HttpOnly cookie named `session` | Keeps the raw token out of JavaScript and reduces XSS token theft risk |
| Cookie flags | `HttpOnly`, `SameSite=Lax`, `path=/`, `Secure` in production | Standard browser session hardening for this MVP |
| Password hashing | `bcryptjs` | Simple cross-platform hashing without native build issues on Windows/Docker |
| Tenant scoping | `brandId` in register/login body; profile resolved from session-backed user | All `users`/`sessions` queries are tenant-scoped |
| Multi-login in one browser | Not supported in MVP | One browser holds one active session cookie, so independent logins for multiple accounts/tenants are not supported |

### Why JWT Is Not Used at This Stage

JWT is intentionally not used in Task 03. The `sessions` table is already the source of truth for active sessions, and every authenticated request must validate against it anyway. Adding JWT would not remove that database lookup; it would only add signed token claims, rotation, and revocation semantics on top of the same session store. There is also no requirement to carry session state across clusters in this MVP, so an opaque session token plus DB lookup is the simpler fit.

### Why Sessions Stay in PostgreSQL (Not Redis)

In general, ephemeral session state is a good fit for Redis: native TTL, cheap revocation, and less read/write pressure on the primary database. This project still stores sessions in PostgreSQL for the MVP because:

1. The assignment already lists `sessions` as part of the minimal data model, so keeping them in PostgreSQL matches the stated scope.
2. Redis in local Docker setups has repeatedly caused extra setup cost on Windows: separate compose variants, environment-specific wiring, and time spent stabilizing dev/reviewer flows instead of feature work.

Redis remains a reasonable production follow-up once session volume or infrastructure complexity justifies a dedicated session store.

### Structured Errors and Correlation ID

Identity endpoints return a structured error body:

```json
{
  "statusCode": 401,
  "errorCode": "INVALID_CREDENTIALS",
  "message": "Invalid email or password",
  "path": "/auth/login",
  "correlationId": "identity-invalid-login"
}
```

Correlation id source:

- Request header: `X-Correlation-Id`
- If omitted, the server generates one and echoes it in the response header and error body

Identity request logs include the correlation id. Passwords and raw session tokens are never logged.

## Docker-Based Local Run

`npm run docker:up` from the repository root starts (Docker Compose project name: `hiring-band`):

1. PostgreSQL 16
2. NestJS application (production build in container)

This avoids manual PostgreSQL installation and gives reviewers a single documented startup path.

## Prisma and Migration Flow

Prisma is the persistence layer for PostgreSQL:

- Schema file: `prisma/schema/schema.prisma`
- Seed scripts: `prisma/seed/` (data in JSON under `prisma/seed/data/`)
- Prisma version: 6.x (classic `schema.prisma` datasource configuration)
- Client generation: `npm run prisma:generate`
- New migration: `npm run prisma:migrate:new -- --name <migration_name>`
- Apply migrations: `npm run prisma:migrate`

Task 02 introduces Prisma tooling, `PrismaService`, the foundation `tenants` table, and idempotent tenant seeds. It does not create empty feature-specific tables.

## Foundation Tenant Model

Task 02 adds a `tenants` table with a unique `brandId` as the stable tenant key. Seeds create `brandA` and `brandB` for local development and reviewer flows. The seed script is idempotent (`upsert` by `brandId`).

## Feature-Specific Model Ownership

| Task | Owns |
|------|------|
| Task 02 (`db`) | `tenants` model, migration tooling, `PrismaService`, tenant seeds |
| Task 03 (`identity`) | `users`, `sessions` models, fields, repositories, types, and migrations |
| Task 04 (`callbacks`) | `raw_events` model, fields, repositories, types, and migrations |

This keeps persistence changes co-located with the feature that needs them.

## Callback Handling (Task 04)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Ingress endpoints | `POST /webhooks/psp/:provider`, `POST /webhooks/gsp/:provider` | Thin adapters per provider family; shared service handles persistence |
| Tenant validation | `brandId` in JSON body via `TenantRepository` | Matches identity tenant key; no tenant headers in this MVP |
| Idempotency key source | `idempotencyKey` field in JSON body | Provider integrations already carry a stable dedup key; no `Idempotency-Key` header in Task 04 |
| Idempotency scope | `brandId + source + provider + idempotencyKey` unique on `raw_events` | One table for capture and dedup; no separate idempotency store in Task 04 |
| Duplicate handling | `200 OK` with `status: "duplicate"` | Safe webhook retries should not surface as client errors |
| Raw event storage | `raw_events` row with `status: "pending"` | Persists provider payload unchanged for future async processing |
| Balance / ledger | Not updated in Task 04 | Callback adapters only ingest and deduplicate; ledger work is a later task |
| Async processing | Not started in Task 04 | `raw_events.status` is stored for a future worker/outbox step |
| Logging | Correlation id, source, provider, brandId, idempotencyKey | Full callback payload is not logged by default |

### Why Callbacks Do Not Update Balance Directly

Webhook handlers run on unreliable, retry-heavy provider traffic. Persisting the raw message first keeps ingestion fast and idempotent while leaving balance/ledger updates to a controlled downstream step that can enforce invariants and replay safely.

### Future Async Processing

`raw_events` with `status: "pending"` is the handoff point for a future worker that validates business rules and posts ledger entries. Task 04 intentionally stops at durable capture plus idempotency.
