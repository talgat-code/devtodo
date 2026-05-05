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
|   |   |-- api/
|   |   |   \-- main.go
|   |   \-- migrate/
|   |       \-- main.go
|   |-- internal/
|   |   |-- config/
|   |   |   \-- config.go
|   |   |-- database/
|   |   |   \-- database.go
|   |   \-- router/
|   |       \-- router.go
|   |-- migrations/
|   \-- go.mod
|-- docs/
|-- frontend/
|-- .env.example
|-- .gitignore
|-- docker-compose.yml
\-- README.md
```

## Local development

1. Install Go and Docker Desktop on your machine.
2. Copy the example environment file:

```cmd
copy .env.example .env
```

3. DevToDo uses Docker PostgreSQL on `127.0.0.1:15433` so it does not conflict with local PostgreSQL services already using other ports.
4. Start PostgreSQL and Adminer:

```cmd
docker compose up -d devtodo-postgres devtodo-adminer
docker compose ps
```

5. Run the database migrations:

```cmd
cd backend
go run ./cmd/migrate up
```

6. Start the backend:

```cmd
go run ./cmd/api
```

The backend uses safe local defaults, so it can start even if you do not set extra environment variables first.

7. Check the health endpoint in another terminal:

```cmd
curl http://localhost:8080/health
```

Expected response:

```json
{
  "status": "ok",
  "app": "DevToDo"
}
```

8. Check the readiness endpoint:

```cmd
curl http://localhost:8080/ready
```

Expected response when PostgreSQL is running:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Expected response when PostgreSQL is not available:

```json
{
  "status": "error",
  "database": "not connected"
}
```

Adminer will be available at `http://localhost:8081`.

### Verify the tables with `psql`

You can confirm the migrations created the tables with:

```cmd
docker compose exec devtodo-postgres psql -U devtodo -d devtodo_db -c "\dt"
```

Expected tables:

- `schema_migrations`
- `users`
- `projects`
- `tasks`

`/health` stays simple and works even if PostgreSQL is not running. `/ready` checks whether the backend can reach PostgreSQL on `127.0.0.1:15433`.

## Current status

Initial setup.
