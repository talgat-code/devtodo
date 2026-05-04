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
|   |       \-- main.go
|   |   \-- migrate/
|   |       \-- main.go
|   |-- internal/
|   |   |-- config/
|   |   |   \-- config.go
|   |   |-- database/
|   |       \-- postgres.go
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

1. Install Go and Docker on your machine.
2. Create your local environment file:

```cmd
copy .env.example .env
```

3. Start PostgreSQL and Adminer:

```cmd
docker compose up -d devtodo-postgres devtodo-adminer
```

4. Run the database migrations:

```cmd
cd backend
go run ./cmd/migrate up
```

5. Start the backend:

```cmd
go run ./cmd/api
```

6. Open the health check:

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

### Check `/ready`

If your local backend already includes the database readiness route, check it with:

```cmd
curl http://localhost:8080/ready
```

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

## Current status

Initial setup.
