# Design Decisions

Architecture choices and trade-offs for the hiring band test backend. Updated incrementally as tasks are implemented.

## Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | NestJS + TypeScript | Required by assignment; strong module boundaries and DI |
| Database | PostgreSQL | Relational model fits users, sessions, raw_events, idempotency_keys; no NoSQL needed |
| ORM | Prisma | Type-safe schema, migrations, and Prisma Client |
| Local run | Docker Compose | Deterministic setup for reviewers; app + PostgreSQL in one command |

## Module Boundaries

```
modules/
  identity/   - Registration, login, profile (task 03)
  callbacks/  - PSP/GSP webhook adapters (task 04)
db/           - Prisma service and data access (task 02)
```

Controllers stay thin; business logic lives in services; persistence goes through Prisma.

## OpenAPI Generation

Swagger is configured via `@nestjs/swagger`:

- Swagger UI at `/api`
- OpenAPI JSON at `/api-json`

Endpoint DTOs and responses will be documented with decorators as features are added.

## Authentication (Planned)

Session-based auth is planned for task 03. JWT is not required for this assessment; the `sessions` table in the minimal data model maps naturally to session tokens.

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
| Task 04 (`callbacks`) | `raw_events`, `idempotency_keys` models, fields, repositories, types, and migrations |

This keeps persistence changes co-located with the feature that needs them.

## Future Decisions (Tasks 03-04)

The following will be recorded as those tasks are implemented:
- Raw event / outbox storage for callbacks
- Idempotency strategy
- Why callbacks do not update balance directly
- Structured error response format
- Correlation ID handling
