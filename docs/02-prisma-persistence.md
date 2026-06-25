# Task 02: Prisma persistence layer

## Source requirements from the assignment

- Minimal data model: `users`, `sessions`, `raw_events`, `idempotency_keys`.
- Tenant isolation (`brandId`).
- Save callback events to `raw_events` (or outbox-like table).
- Idempotency for repeated callbacks.
- Clear module boundaries, including `persistence`.

## Goal

Set up Prisma with PostgreSQL, add the foundational `tenants` model for tenant isolation, and prepare the tooling that later tasks will use to add their own models, repositories, types, and migrations.

## Scope

**In scope:**

- Prisma schema foundation with PostgreSQL datasource and Prisma Client generator.
- `tenants` table as the shared tenant foundation.
- Idempotent seed data for baseline tenants: `brandA` and `brandB`.
- Migration scripts for creating new migrations and applying unapplied migrations.
- `PrismaService` / db module in NestJS.
- Documentation of model ownership: feature-specific models are added by the tasks that implement those features.
- Update `README.md` (env, database setup, migrations) and `DECISIONS.md`.

**Out of scope:**

- Auth endpoint implementation (task 03).
- Webhook handler implementation (task 04).
- Empty placeholder tables for `users`, `sessions`, `raw_events`, or `idempotency_keys`.
- Feature-specific repositories, types, fields, and constraints.
- Ledger/balance tables.

## Dependencies

- Task 01: NestJS application, Docker Compose with PostgreSQL, npm scripts.

## Expected project changes

```
prisma/
  schema.prisma
  seed.ts
  migrations/
src/
  db/
    db.module.ts
    prisma.service.ts
```

## README.md — what to add

- Environment variables: `DATABASE_URL` and related settings.
- Migration commands for creating a new migration and applying unapplied migrations.
- Prisma Client generation command.
- Seed command for baseline tenants.
- How Prisma connects to PostgreSQL in Docker Compose.

## API.md — what to add

No changes at this stage (no new endpoints).

## DECISIONS.md — what to record

- PostgreSQL as the sole database engine (NoSQL is not used).
- Prisma as ORM/migration tool.
- `tenants` as the foundation model for tenant isolation.
- Seed tenants:
  - `brandA`
  - `brandB`
- Feature-specific model ownership:
  - Task 03 owns identity models/repositories/types (`users`, `sessions`).
  - Task 04 owns callback models/repositories/types (`raw_events`).
- Task 02 provides Prisma tooling and the shared tenant foundation, but does not create empty feature tables.

## Required tests

- Optional: unit/integration test for `PrismaService` connect/disconnect.
- Main tenant leakage and callback idempotency tests remain in tasks 03 and 04.

## Evaluation focus

- **Multi-tenant discipline:** Task 02 introduces `tenants` and seed data that later tenant-scoped feature tests can use.
- **Practicality for MVP delivery:** migration commands are clear and usable before feature work begins.

## Definition of done

- [ ] Prisma schema foundation includes `tenants` and no empty feature-specific tables.
- [ ] Migration creation and migration application commands are available.
- [ ] Baseline tenant seeds (`brandA`, `brandB`) are idempotent and documented.
- [ ] Prisma Client generation command is available.
- [ ] `DbModule` exports `PrismaService` for other modules.
- [ ] `README.md` updated: env, database setup, migration commands.
- [ ] `DECISIONS.md` updated: Prisma, migration flow, and feature-specific model ownership.
