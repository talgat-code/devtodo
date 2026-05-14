param()

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = (Resolve-Path (Join-Path $scriptDir "..")).Path
$backendDir = Join-Path $repoRoot "backend"

function Write-Step {
    param([string]$Message)

    Write-Host ""
    Write-Host "[STEP] $Message" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)

    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Assert-ExitCode {
    param([string]$Action)

    if ($LASTEXITCODE -ne 0) {
        throw "$Action failed with exit code $LASTEXITCODE."
    }
}

if (-not (Test-Path (Join-Path $repoRoot ".env")) -and (Test-Path (Join-Path $repoRoot ".env.example"))) {
    Copy-Item (Join-Path $repoRoot ".env.example") (Join-Path $repoRoot ".env")
    Write-Info "Created .env from .env.example."
}

$env:APP_PORT = "18080"

Write-Info "Backend URL: http://localhost:18080"
Write-Info "PostgreSQL host port: 15433"
Write-Info "Optional Adminer URL: http://localhost:8081"

Push-Location $repoRoot
try {
    Write-Step "Starting PostgreSQL in Docker"
    & docker compose up -d devtodo-postgres
    Assert-ExitCode "docker compose up -d devtodo-postgres"

    Write-Step "Running backend migrations"
    Push-Location $backendDir
    try {
        $migrationSucceeded = $false

        for ($attempt = 1; $attempt -le 10; $attempt++) {
            Write-Host ("Migration attempt {0}/10" -f $attempt)
            & go run ./cmd/migrate up

            if ($LASTEXITCODE -eq 0) {
                $migrationSucceeded = $true
                break
            }

            if ($attempt -lt 10) {
                Write-Info "PostgreSQL is still starting. Waiting 3 seconds before retrying."
                Start-Sleep -Seconds 3
            }
        }

        if (-not $migrationSucceeded) {
            throw "Backend migrations did not succeed after multiple attempts."
        }

        Write-Step "Starting backend server"
        Write-Host "DevToDo backend is running at http://localhost:18080" -ForegroundColor Green
        Write-Host "Press Ctrl+C to stop the backend." -ForegroundColor Green
        & go run ./cmd/api
        Assert-ExitCode "go run ./cmd/api"
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
