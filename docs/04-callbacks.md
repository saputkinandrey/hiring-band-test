# Task 04: PSP/GSP callback stubs

## Source requirements from the assignment

- `POST /webhooks/psp/:provider`
- `POST /webhooks/gsp/:provider`
- Save callback events to `raw_events` (or outbox-like table)
- Idempotency for repeated callbacks
- Tenant isolation (`brandId`)
- **No direct balance updates** in PSP/GSP adapters
- Structured error responses with clear status codes
- Basic observability hooks (request/correlation id in logs)
- Tests: integration test for callback idempotency; at least 1 unit test for use-case/business logic
- Nice to have: contract test for webhook payload schema
- Acceptance: duplicate callbacks safely ignored/deduplicated; callback payload persisted; tenant context validated

## Goal

Implement safe PSP/GSP callback handling: raw event persistence, idempotency, tenant validation, no direct balance updates. Prepare the service for future ledger integration.

## Scope

**In scope:**

- Shared application service for PSP and GSP callbacks.
- `POST /webhooks/psp/:provider` and `POST /webhooks/gsp/:provider`.
- Persist payload in `raw_events`.
- Idempotency via `idempotency_keys` and/or unique constraints.
- Finalize callback-specific Prisma fields and constraints:
  - `raw_events.source`, `raw_events.provider`, `raw_events.externalEventId`, `raw_events.payload`, `raw_events.status`.
  - unique constraint on `brandId + source + provider + externalEventId`.
  - `idempotency_keys.scope`, `idempotency_keys.key`, optional relation to `raw_events`.
  - unique constraint on `brandId + scope + key`.
- Resolve and validate `brandId` from payload/headers.
- Structured error responses and correlation id in logs.
- OpenAPI decorators for callback DTOs, success, duplicate, and error responses.
- Integration test for callback idempotency.
- Contract test for webhook payload schema.
- Unit test for callback use-case (if chosen as the primary business-logic unit test).
- Final update of `README.md` (reviewer flow from scratch), `API.md`, `DECISIONS.md`.

**Out of scope:**

- Ledger integration and balance updates.
- Async processing of raw_events (can be noted as future work in DECISIONS).

## Dependencies

- Task 01: NestJS app, Swagger, Docker.
- Task 02: Prisma tooling, migration flow, `PrismaService`, `tenants` table, and baseline tenant seeds (`brandA`, `brandB`).
- Task 03: correlation id middleware/filter (reuse).

## Expected project changes

```
src/modules/callbacks/
  callbacks.module.ts
  psp-callback.controller.ts
  gsp-callback.controller.ts
  callback.service.ts
  dto/
  tests/
```

## README.md — what to add

- Commands for testing the callback flow.
- **Final reviewer flow from scratch:** clone -> env -> `docker:up` -> migrate -> test -> Swagger -> webhook call examples.
- How to send a test PSP/GSP callback (curl example or link to API.md).

## API.md — what to add

- `POST /webhooks/psp/:provider` — request/response examples.
- `POST /webhooks/gsp/:provider` — request/response examples.
- Duplicate callback: same idempotency key / external event id — expected deduplicated response.
- Error responses: 400 invalid payload, 409 duplicate (if chosen), 422 schema validation.
- Correlation id in examples.

## DECISIONS.md — what to record

- Idempotency strategy: key from payload (`externalEventId` + `brandId` + `provider`) or `Idempotency-Key` header.
- Raw event handling: store full payload as JSON, status `pending` for future processing.
- Why callbacks do not update balance: adapters only persist events; ledger is a separate bounded context.
- Separation of adapter (controller) vs application service vs persistence.
- Structured error format and correlation id for callback flow.
- Contract test approach: JSON schema or class-validator DTO validation.

## Required tests

- **Integration test:** repeated callback with the same idempotency key does not create a duplicate `raw_events` row (or returns a deduplicated result).
- **Contract test:** invalid webhook payload is rejected with a clear error; valid payload passes schema.
- **Unit test:** callback service idempotency logic or raw event persistence logic.
- **Structured error test:** malformed callback payload returns 400/422 with structured body.

## Evaluation focus

- **Reliability of callback handling:** idempotency under concurrent duplicates; payload is always persisted on first receipt.
- **API/module boundaries:** thin controllers; shared `CallbackService`; no balance logic in adapters.
- **Multi-tenant discipline:** `brandId` is validated and applied in storage queries.
- **Practicality for MVP delivery:** reviewer can run the full flow from README; Swagger and API.md cover webhooks.

## Definition of done

- [ ] `POST /webhooks/psp/:provider` accepts payload, persists raw event, applies idempotency.
- [ ] `POST /webhooks/gsp/:provider` works through the same application service.
- [ ] Repeated callback is safely deduplicated.
- [ ] No direct balance updates in callback code.
- [ ] `brandId` is validated and used in queries.
- [ ] Structured errors and correlation id in callback flow.
- [ ] OpenAPI documents webhook endpoints.
- [ ] Integration test for idempotency passes.
- [ ] Contract test for webhook schema passes.
- [ ] `README.md` contains the full reviewer flow from scratch.
- [ ] `API.md` and `DECISIONS.md` are up to date.
