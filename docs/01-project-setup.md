# Task 01: Backend project initialization

## Source requirements from the assignment

- Use NestJS + TypeScript.
- Clear module boundaries (`identity`, `callbacks`, `persistence`).
- Deterministic local run flow (single command if possible).
- Repository with setup/run instructions (start of `README.md`).
- Nice to have: OpenAPI spec generation, docker-compose for app + database.

## Goal

Prepare a minimal but complete backend service skeleton: git repository, NestJS application, Docker-based local run flow, basic npm scripts, Swagger/OpenAPI, and initial living docs (`README.md`, `DECISIONS.md`).

## Scope

**In scope:**

- Initialize git repository and `.gitignore`.
- Create NestJS + TypeScript application.
- Prettier and npm scripts for run, test, and formatting.
- `Dockerfile`, `docker-compose.yml` for app + PostgreSQL.
- Stable wrapper `npm run docker:up` (or equivalent).
- Basic Swagger UI and OpenAPI JSON route setup.
- Module skeleton: `identity`, `callbacks`, `db` (empty or with stubs).
- Start `README.md` and `DECISIONS.md`.

**Out of scope:**

- Prisma schema and migrations (task 02).
- Endpoint implementation (tasks 03, 04).
- Auth and callback business logic.

## Dependencies

None. This is the first task.

## Expected project changes

```
src/
  main.ts
  app.module.ts
  modules/
    identity/
    callbacks/
  db/
Dockerfile
docker-compose.yml
package.json
tsconfig.json
.prettierrc
.gitignore
README.md
DECISIONS.md
```

## README.md — what to add

- Project and stack description (NestJS, TypeScript, PostgreSQL, Prisma, Docker).
- Prerequisites (Docker, Node.js for local development without Docker).
- Quick start: `npm run docker:up` (or equivalent).
- Links to Swagger UI (`/api` or chosen route) and OpenAPI JSON.
- Basic commands: `npm run start`, `npm run test`, `npm run format`.

## API.md — what to add

At this stage, create the file with a header and a link to Swagger UI as the primary API documentation source. Concrete request examples are added in tasks 03 and 04.

## DECISIONS.md — what to record

- Stack choice: NestJS + TypeScript + Prisma + PostgreSQL.
- Docker-based local run flow instead of manual PostgreSQL installation.
- Module structure: `identity`, `callbacks`, `db`.
- OpenAPI generation via `@nestjs/swagger`.
- Session-based auth planned in task 03 (mention as intent, do not implement here).

## Required tests

At this stage, a smoke test is sufficient: the application starts and a health/root endpoint responds (if added). Full tests come in tasks 03 and 04.

## Evaluation focus

- **Practicality for MVP delivery:** one clear startup path via Docker Compose; reviewer can bring up the project from README alone.
- **API/module boundaries:** establish folder structure and NestJS modules without mixing concerns.

## Definition of done

- [ ] Git repository initialized; `.gitignore` covers Node/NestJS/Prisma/env artifacts.
- [ ] NestJS application builds and runs.
- [ ] `docker-compose.yml` starts app + PostgreSQL; `npm run docker:up` works.
- [ ] Swagger UI and OpenAPI JSON are available after startup.
- [ ] Modules `identity`, `callbacks`, `db` are registered in `AppModule`.
- [ ] `README.md` describes setup and local run flow.
- [ ] `DECISIONS.md` contains basic architectural decisions.
- [ ] Project is ready for adding a remote and pushing to the user's account.
