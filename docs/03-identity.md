# Task 03: Identity module

## Source requirements from the assignment

- `POST /auth/register`
- `POST /auth/login`
- `GET /profile/me`
- Tenant isolation (`brandId`)
- Structured error responses with clear status codes
- Basic observability hooks (request/correlation id in logs)
- Tests: at least 1 unit test for use-case/business logic; tenant leakage test (`brandA` cannot access `brandB` data)
- Nice to have: OpenAPI spec generation

## Goal

Implement the identity module: registration, login, and current user profile with session-based auth and strict tenant isolation.

## Scope

**In scope:**

- `POST /auth/register` — create a user within a `brandId`.
- `POST /auth/login` — verify credentials, create a session.
- `GET /profile/me` — profile by session token, tenant-scoped.
- Structured error responses for identity endpoints.
- Request/correlation id in identity request flow and logs.
- OpenAPI decorators for DTOs, success and error responses.
- Tenant leakage test.
- Unit test for identity use-case (register/login/session validation).
- Update `README.md`, `API.md`, `DECISIONS.md`.

**Out of scope:**

- JWT (session-based auth is sufficient).
- Password reset, email verification.
- Webhook/callback logic (task 04).

## Dependencies

- Task 01: NestJS app, Swagger, Docker.
- Task 02: `users`, `sessions` in Prisma, `PrismaService`.

## Expected project changes

```
src/modules/identity/
  identity.module.ts
  identity.controller.ts
  identity.service.ts
  dto/
  guards/ or middleware for session auth
  tests/
```

## README.md — what to add

- Commands for testing the identity flow (if new npm scripts are added).
- Example env for session secret (if needed).
- Brief auth flow description: register -> login -> profile/me.

## API.md — what to add

- `POST /auth/register` — request/response examples with `brandId`.
- `POST /auth/login` — request/response, session token in response or cookie/header.
- `GET /profile/me` — request with session token, profile response.
- Error responses: 400 validation, 401 unauthorized, 409 conflict (duplicate email within brand).
- Request/correlation id header usage in examples.

## DECISIONS.md — what to record

- Session-based auth instead of JWT.
- How the session token is passed (`Authorization: Bearer` header, cookie, or custom header).
- How `brandId` is passed and validated (header, body, or from session).
- Password hashing (bcrypt/argon2).
- Structured error response format for identity.
- Correlation id: source (`X-Correlation-Id` header or generated).

## Required tests

- **Unit test:** register, login, or session validation use-case.
- **Tenant leakage test:** user/session from `brandA` cannot access profile/data from `brandB`.
- **Structured error test:** invalid login returns a clear 401 with structured body.

## Evaluation focus

- **API/module boundaries:** thin controller, business logic in service, persistence via PrismaService/repository.
- **Multi-tenant discipline:** all queries to `users`/`sessions` are filtered by `brandId`; tenant leakage test passes.

## Definition of done

- [ ] `POST /auth/register` creates a user in the specified `brandId`.
- [ ] `POST /auth/login` creates a session and returns a token.
- [ ] `GET /profile/me` returns profile only for the current tenant/session.
- [ ] Structured errors with clear status codes.
- [ ] Correlation id is present in identity request logs.
- [ ] OpenAPI documents identity endpoints.
- [ ] Tenant leakage test passes.
- [ ] Unit test for identity use-case passes.
- [ ] `API.md` and `DECISIONS.md` are updated.
