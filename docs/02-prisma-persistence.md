# Task 02: Prisma persistence layer

## Source requirements from the assignment

- Minimal data model: `users`, `sessions`, `raw_events`, `idempotency_keys`.
- Tenant isolation (`brandId`).
- Save callback events to `raw_events` (or outbox-like table).
- Idempotency for repeated callbacks.
- Clear module boundaries, including `persistence`.

## Goal

Set up Prisma with PostgreSQL, define the minimal data schema with tenant-scoped constraints, and prepare the persistence layer for identity and callbacks.

## Scope

**In scope:**

- Prisma schema and migrations for `users`, `sessions`, `raw_events`, `idempotency_keys`.
- `brandId` on all tenant-scoped models.
- Unique constraints for idempotency (e.g. `brandId + provider + externalEventId` or a computed idempotency key).
- `PrismaService` / db module in NestJS.
- Update `README.md` (env, database setup, migrations) and `DECISIONS.md`.

**Out of scope:**

- Auth endpoint implementation (task 03).
- Webhook handler implementation (task 04).
- Ledger/balance tables.

## Dependencies

- Task 01: NestJS application, Docker Compose with PostgreSQL, npm scripts.

## Expected project changes

```
prisma/
  schema.prisma
  migrations/
src/
  db/
    db.module.ts
    prisma.service.ts
```

## README.md — what to add

- Environment variables: `DATABASE_URL` and related settings.
- Migration commands: `npx prisma migrate dev`, `npx prisma generate` (or npm wrappers).
- How Prisma connects to PostgreSQL in Docker Compose.

## API.md — what to add

No changes at this stage (no new endpoints).

## DECISIONS.md — what to record

- PostgreSQL as the sole database engine (NoSQL is not used).
- Prisma as ORM/migration tool.
- Tenant model: `brandId` as a required field on tenant-scoped entities.
- `raw_events` as an outbox-like table for callback payloads (no balance mutations).
- Idempotency storage: unique constraint at DB level + application-level duplicate key handling.
- Indexes and unique constraints for tenant-scoped queries.

## Required tests

- Optional: unit/integration test for `PrismaService` connect/disconnect.
- Main tenant and idempotency tests — in tasks 03 and 04.

## Evaluation focus

- **Multi-tenant discipline:** `brandId` in schema, indexes, and unique constraints prevent incorrect cross-tenant idempotency collisions.
- **Reliability of callback handling:** storage constraints guarantee deduplication at DB level under concurrent duplicate callbacks.

## Definition of done

- [ ] Prisma schema defines `users`, `sessions`, `raw_events`, `idempotency_keys`.
- [ ] All tenant-scoped models contain `brandId`.
- [ ] Unique constraint for callback idempotency flow is defined.
- [ ] Migrations apply via Docker/local flow documented in README.
- [ ] `DbModule` exports `PrismaService` for other modules.
- [ ] `README.md` updated: env, database setup, migration commands.
- [ ] `DECISIONS.md` updated: Prisma, tenant model, raw_events, idempotency storage.
