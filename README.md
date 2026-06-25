# Hiring Band Test Backend

Backend service for the Backend Engineer technical assessment. Demonstrates identity basics, safe PSP/GSP callback handling, and readiness for future ledger integration.

## Stack

- NestJS + TypeScript
- PostgreSQL (via Docker Compose)
- Prisma (planned in task 02)
- Docker Compose for local development

## Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- [Node.js](https://nodejs.org/) 22+ (optional, for local development without Docker)

## Quick Start

From the repository root:

```bash
docker compose up --build
```

If you prefer npm and PowerShell blocks `npm` with an execution policy error, use:

```powershell
npm.cmd run docker:up
```

Or fix the policy once for your user account:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then `npm run docker:up` works as usual.

This starts the application and PostgreSQL. The API is available at `http://localhost:3000`.

Stop services:

```bash
docker compose down
```

On Windows PowerShell with execution policy restrictions:

```powershell
npm.cmd run docker:down
```

## API Documentation

- Swagger UI: http://localhost:3000/api
- OpenAPI JSON: http://localhost:3000/api-json

See [API.md](API.md) for request examples (added incrementally as endpoints are implemented).

## Development Commands

Run from the repository root:

| Command | Description |
|---------|-------------|
| `npm run start` | Start the application |
| `npm run start:dev` | Start with hot reload |
| `npm run build` | Build for production |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run e2e tests |
| `npm run format` | Format code with Prettier |
| `npm run docker:up` | Start app + PostgreSQL via Docker Compose |
| `npm run docker:down` | Stop Docker Compose services |

## Environment

Copy `.env.example` to `.env`, fill in PostgreSQL credentials and `DATABASE_URL`, then adjust other values if needed. Docker Compose reads these values for PostgreSQL and app configuration:

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `PORT` | HTTP port (default: 3000) |
| `NODE_ENV` | Runtime environment (default: development) |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_PORT` | PostgreSQL host port (default: 5432) |
| `POSTGRES_HOST` | PostgreSQL host for local (non-Docker) runs (default: localhost) |
| `DATABASE_URL` | PostgreSQL connection string for local development |

Database migrations will be documented in task 02.

## Project Structure

```
src/
  modules/
    health/        # Health check
    identity/      # Auth and profile (task 03)
    callbacks/     # PSP/GSP webhooks (task 04)
  db/              # Prisma and data access (task 02)
prisma/            # Schema and migrations (task 02)
docker-compose.yml
Dockerfile
```

## Health Check

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

## Design Decisions

See [DECISIONS.md](DECISIONS.md) for architecture choices and trade-offs.
