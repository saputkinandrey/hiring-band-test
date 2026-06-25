# Design Decisions

Architecture choices and trade-offs for the hiring band test backend. Updated incrementally as tasks are implemented.

## Stack

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Framework | NestJS + TypeScript | Required by assignment; strong module boundaries and DI |
| Database | PostgreSQL | Relational model fits users, sessions, raw_events, idempotency_keys; no NoSQL needed |
| ORM | Prisma | Planned in task 02; type-safe schema and migrations |
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

## Future Decisions (Tasks 02-04)

The following will be recorded as those tasks are implemented:

- Tenant model (`brandId` scoping)
- Raw event / outbox storage for callbacks
- Idempotency strategy
- Why callbacks do not update balance directly
- Structured error response format
- Correlation ID handling
