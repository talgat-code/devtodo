# DevToDo

DevToDo is a simple portfolio web application starter with a minimal Go backend and room for a future frontend.

## Tech stack

- Go
- Gin
- PostgreSQL
- SvelteKit
- Tailwind CSS
- Docker
- Git

## Project structure

```text
devtodo/
|-- backend/
|   |-- cmd/
|   |   \-- api/
|   |       \-- main.go
|   |-- internal/
|   |   |-- config/
|   |   |   \-- config.go
|   |   \-- router/
|   |       \-- router.go
|   \-- go.mod
|-- docs/
|-- frontend/
|-- .env.example
|-- .gitignore
|-- docker-compose.yml
\-- README.md
```

## Local development

1. Install Go and Docker on your machine.
2. Copy `.env.example` to `.env`.
3. Start PostgreSQL and Adminer:

```bash
docker compose up -d devtodo-postgres devtodo-adminer
```

4. Start the backend:

```bash
cd backend
go run ./cmd/api
```

5. Open the health check:

```text
http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "DevToDo"
}
```

Adminer will be available at `http://localhost:8081`.

The backend does not use PostgreSQL yet, so you can still run the `/health` endpoint even if the database is not started.

## Current status

Initial setup.
