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
|   |-- run-backend.ps1
|   |-- run-frontend.ps1
|   |-- run-smoke-test.ps1
|   \-- smoke-test.ps1
|-- .env.example
|-- docker-compose.yml
\-- README.md
```

## Quick start on Windows

Terminal 1:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-backend.ps1
```

Terminal 2:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-frontend.ps1
```

Terminal 3:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-smoke-test.ps1
```

Local URLs:

- Backend: `http://localhost:18080`
- Frontend: `http://localhost:5173`
- Adminer: `http://localhost:8081`
- PostgreSQL host port: `15433`

`scripts/run-backend.ps1` starts Docker PostgreSQL, runs migrations, and launches the backend on port `18080`.

`scripts/run-frontend.ps1` installs frontend dependencies when needed and starts Vite on port `5173`.

`scripts/run-smoke-test.ps1` runs the existing smoke test against `http://localhost:18080`.

## Environment files

Root `.env.example` is set up for the recommended local backend URL:

```env
APP_PORT=18080
POSTGRES_HOST=127.0.0.1
POSTGRES_PORT=15433
POSTGRES_USER=devtodo
POSTGRES_PASSWORD=devtodo_password
POSTGRES_DB=devtodo_db
POSTGRES_SSLMODE=disable
DATABASE_URL=postgres://devtodo:devtodo_password@127.0.0.1:15433/devtodo_db?sslmode=disable
JWT_SECRET=change_me_later
```

Frontend `frontend/.env.example` points to the local backend:

```env
VITE_API_BASE_URL=http://localhost:18080
```

The helper scripts create `.env` or `frontend/.env` from their example files if they are missing.

## Manual setup

If you want to run things manually instead of using the helper scripts:

1. Copy the environment files:

```powershell
Copy-Item .env.example .env
Copy-Item frontend\.env.example frontend\.env
```

2. Start PostgreSQL:

```powershell
docker compose up -d devtodo-postgres
```

3. Optional: start Adminer:

```powershell
docker compose up -d devtodo-adminer
```

4. Run backend migrations:

```powershell
cd backend
go run ./cmd/migrate up
```

5. Start the backend on port `18080`:

```powershell
$env:APP_PORT = "18080"
go run ./cmd/api
```

6. Start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses `VITE_API_BASE_URL`, and the Vite dev server proxies `/api`, `/health`, and `/ready` to that backend URL.

## Health checks

```powershell
curl http://localhost:18080/health
curl http://localhost:18080/ready
```

## Auth API

### Register

```cmd
curl -X POST http://localhost:18080/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"John Doe\",\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

### Login

```cmd
curl -X POST http://localhost:18080/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"john@example.com\",\"password\":\"password123\"}"
```

Copy the `access_token` value from the login response.

```cmd
set TOKEN=PASTE_ACCESS_TOKEN_HERE
```

### Get `/api/me`

```cmd
curl http://localhost:18080/api/me ^
  -H "Authorization: Bearer %TOKEN%"
```

## Projects API

### Create project

```cmd
curl -X POST http://localhost:18080/api/projects ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Networking Labs\",\"description\":\"HCIA lab reports\",\"color\":\"#4F46E5\"}"
```

```cmd
set PROJECT_ID=PASTE_PROJECT_ID_HERE
```

### List projects

```cmd
curl http://localhost:18080/api/projects ^
  -H "Authorization: Bearer %TOKEN%"
```

### Get project

```cmd
curl http://localhost:18080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

### Update project

```cmd
curl -X PATCH http://localhost:18080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Updated title\",\"description\":\"Updated description\",\"color\":\"#10B981\"}"
```

### Delete project

```cmd
curl -X DELETE http://localhost:18080/api/projects/%PROJECT_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

## Tasks API

### Create task

```cmd
curl -X POST http://localhost:18080/api/projects/%PROJECT_ID%/tasks ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Finish lab report\",\"description\":\"Write PPPoE section\",\"status\":\"todo\",\"priority\":\"medium\",\"due_date\":null}"
```

```cmd
set TASK_ID=PASTE_TASK_ID_HERE
```

### List tasks

```cmd
curl http://localhost:18080/api/projects/%PROJECT_ID%/tasks ^
  -H "Authorization: Bearer %TOKEN%"
```

### Get task

```cmd
curl http://localhost:18080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

### Update task

```cmd
curl -X PATCH http://localhost:18080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Updated task title\",\"description\":\"Updated description\",\"status\":\"in_progress\",\"priority\":\"high\",\"due_date\":\"2026-05-10T15:00:00Z\"}"
```

### Delete task

```cmd
curl -X DELETE http://localhost:18080/api/tasks/%TASK_ID% ^
  -H "Authorization: Bearer %TOKEN%"
```

## Smoke test

Keep the existing smoke test in place:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/run-smoke-test.ps1
```
