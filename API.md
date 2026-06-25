# API Reference

Concrete request/response examples are added incrementally as endpoints are implemented in tasks 03 and 04.

## Interactive Documentation

The primary API documentation source is Swagger UI:

- **Swagger UI:** http://localhost:3000/api
- **OpenAPI JSON:** http://localhost:3000/api-json

Start the application first (see [README.md](README.md)).

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

## Planned Endpoints

The following endpoints will be documented here as they are implemented:

- `POST /auth/register`
- `POST /auth/login`
- `GET /profile/me`
- `POST /webhooks/psp/:provider`
- `POST /webhooks/gsp/:provider`
