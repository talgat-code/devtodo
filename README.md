# DevToDo

DevToDo is a Go + PostgreSQL backend with a Vite + React + TypeScript frontend for personal projects and task tracking.

## Tech stack

- Go
- Gin
- PostgreSQL
- Vite
- React
- TypeScript
- Tailwind CSS
- Docker

## Project structure

```text
devtodo/
|-- backend/
|-- docs/
|-- frontend/
|   |-- src/
|   |   |-- api/
|   |   |   \-- client.ts
|   |   |-- components/
|   |   |-- styles/
|   |   |   \-- index.css
|   |   |-- App.tsx
|   |   |-- main.tsx
|   |   \-- types.ts
|   |-- .env.example
|   |-- index.html
|   |-- package.json
|   |-- tailwind.config.ts
|   \-- vite.config.ts
|-- scripts/
|   \-- smoke-test.ps1
|-- .env.example
|-- docker-compose.yml
\-- README.md
```

## Backend setup

1. Install Go and Docker Desktop.
2. Copy the root environment file:

```cmd
copy .env.example .env
```

3. Start PostgreSQL and Adminer:

```cmd
docker compose up -d devtodo-postgres devtodo-adminer
docker compose ps
```

4. Run migrations:

```cmd
cd backend
go run ./cmd/migrate up
```

5. Start the backend:

```cmd
go run ./cmd/api
```

The default backend URL is `http://localhost:8080`.

Adminer is available at `http://localhost:8081`.

### Health checks

```cmd
curl http://localhost:8080/health
curl http://localhost:8080/ready
```

## Frontend setup

The frontend lives inside `frontend/` and uses `VITE_API_BASE_URL` to decide which backend to talk to.

1. Copy the frontend environment file:

```cmd
cd frontend
copy .env.example .env
```

2. Install dependencies:

```cmd
npm install
```

3. Start the frontend dev server on port `5173`:

```cmd
npm run dev
```

4. Open the app:

```text
http://localhost:5173
```

### Switching backend ports

`frontend/.env.example` contains:

```env
VITE_API_BASE_URL=http://localhost:8080
```

If your backend is running on `http://localhost:18080`, change it to:

```env
VITE_API_BASE_URL=http://localhost:18080
```

The Vite dev server proxies `/api`, `/health`, and `/ready` to `VITE_API_BASE_URL`, which helps avoid local CORS issues without changing the Go backend.

## Typical local workflow

1. Start PostgreSQL:

```cmd
docker compose up -d devtodo-postgres devtodo-adminer
```

2. Run migrations and start the API:

```cmd
cd backend
go run ./cmd/migrate up
go run ./cmd/api
```

3. Start the frontend:

```cmd
cd frontend
npm install
npm run dev
```

4. Open `http://localhost:5173`.

## Auth API

### Register

```cmd
curl -X POST http://localhost:8080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### Login

```cmd
curl -X POST http://localhost:8080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

Copy the `access_token` value from the login response.

```cmd
set TOKEN=PASTE_ACCESS_TOKEN_HERE
```

### Get `/api/me`

```cmd
curl http://localhost:8080/api/me ^
  -H "Authorization: Bearer %TOKEN%"
```

## Projects API

### Create project

```cmd
curl -X POST http://localhost:8080/api/projects ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Networking Labs\",\"description\":\"HCIA lab reports\",\"color\":\"#4F46E5\"}"
```

```cmd
set PROJECT_ID=PASTE_PROJECT_ID_HERE
```

### List projects

```cmd
curl http://localhost:8080/api/projects ^
  -H "Authorization: Bearer %TOKEN%"
```

### Get project

```cmd
curl http://localhost:8080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

### Update project

```cmd
curl -X PATCH http://localhost:8080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Updated title\",\"description\":\"Updated description\",\"color\":\"#10B981\"}"
```

### Delete project

```cmd
curl -X DELETE http://localhost:8080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

## Tasks API

### Create task

```cmd
curl -X POST http://localhost:8080/api/projects/%PROJECT_ID%/tasks ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Finish lab report\",\"description\":\"Write PPPoE section\",\"status\":\"todo\",\"priority\":\"medium\",\"due_date\":null}"
```

```cmd
set TASK_ID=PASTE_TASK_ID_HERE
```

### List tasks

```cmd
curl http://localhost:8080/api/projects/%PROJECT_ID%/tasks ^
  -H "Authorization: Bearer %TOKEN%"
```

### Get task

```cmd
curl http://localhost:8080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

### Update task

```cmd
curl -X PATCH http://localhost:8080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Updated task title\",\"description\":\"Updated description\",\"status\":\"in_progress\",\"priority\":\"high\",\"due_date\":\"2026-05-10T15:00:00Z\"}"
```

### Delete task

```cmd
curl -X DELETE http://localhost:8080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

## Smoke test

Keep the existing smoke test in place:

```cmd
powershell -ExecutionPolicy Bypass -File scripts/smoke-test.ps1
```
